import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import type { Database, VariableDefinition } from "@/types/database";

// Streaming response bypasses Vercel's 10s timeout — no edge runtime needed.
// (Edge runtime can't use the Anthropic SDK due to node:fs/node:path deps.)

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables");
  return createClient<Database>(url, key);
}

function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  return new Anthropic({ apiKey: key });
}

/**
 * Build the extraction tool schema from variable definitions.
 * This gives Claude a structured output format via tool_use.
 */
function buildExtractionTool(variables: VariableDefinition[]): Anthropic.Tool {
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];

  for (const v of variables) {
    if (!v.enabled) continue;

    required.push(v.name);

    switch (v.type) {
      case "boolean":
        properties[v.name] = {
          type: "boolean",
          description: v.description ?? v.name,
        };
        break;
      case "integer":
        properties[v.name] = {
          type: "integer",
          description: v.description ?? v.name,
        };
        break;
      case "string":
        properties[v.name] = {
          type: "string",
          description: v.description ?? v.name,
        };
        break;
      case "enum":
        properties[v.name] = {
          type: "string",
          enum: v.enum_values ?? [],
          description: v.description ?? v.name,
        };
        break;
    }
  }

  return {
    name: "extract_creative_variables",
    description:
      "Extract visual and messaging variables from the creative image. Analyse the image carefully and fill in every variable.",
    input_schema: {
      type: "object" as const,
      properties,
      required,
    },
  };
}

/**
 * Get a public URL for a creative image from Supabase Storage.
 */
function getImageUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  return `${supabaseUrl}/storage/v1/object/public/creatives/${storagePath}`;
}

/**
 * Analyse a single creative with Claude Vision.
 */
async function analyseCreative(
  anthropic: Anthropic,
  imageUrl: string,
  tool: Anthropic.Tool,
  brandContext: string
): Promise<{
  extracted: Record<string, unknown>;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}> {
  const start = Date.now();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    tools: [tool],
    tool_choice: { type: "tool", name: "extract_creative_variables" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: `You are analysing a creative ad image for a performance marketing study.

Brand context: ${brandContext}

Carefully examine the image and extract every variable defined in the tool schema. Be accurate and objective. For enum fields, pick the closest matching option. For boolean fields, answer based on what is clearly visible. For string fields, be concise.`,
          },
        ],
      },
    ],
  });

  const durationMs = Date.now() - start;

  // Extract the tool use result
  const toolBlock = response.content.find(
    (b) => b.type === "tool_use"
  );

  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use block");
  }

  return {
    extracted: toolBlock.input as Record<string, unknown>,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    durationMs,
  };
}

/**
 * POST /api/analysis — Run AI extraction on all mapped creatives.
 * Streams progress updates as newline-delimited JSON.
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, schemaId } = await request.json();

    if (!projectId || !schemaId) {
      return NextResponse.json(
        { error: "Missing projectId or schemaId" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const anthropic = getAnthropic();

    // Fetch the variable schema
    const { data: schema, error: schErr } = await supabase
      .from("variable_schemas")
      .select("*")
      .eq("id", schemaId)
      .single();

    if (schErr || !schema) {
      return NextResponse.json(
        { error: "Schema not found" },
        { status: 404 }
      );
    }

    // Fetch project for brand context
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const brandContext = project
      ? `Brand: ${project.brand_name}, Category: ${project.brand_category}, Platform: ${project.platform}, KPI: ${project.primary_kpi}${project.campaign_goal ? `, Goal: ${project.campaign_goal}` : ""}${project.target_audience ? `, Audience: ${project.target_audience}` : ""}`
      : "Unknown brand";

    // Fetch confirmed mappings with creative details
    const { data: mappings, error: mapErr } = await supabase
      .from("creative_mappings")
      .select("creative_id")
      .eq("project_id", projectId)
      .eq("status", "confirmed");

    if (mapErr) {
      return NextResponse.json(
        { error: mapErr.message },
        { status: 500 }
      );
    }

    const creativeIds = [
      ...new Set((mappings ?? []).map((m) => m.creative_id)),
    ];

    if (creativeIds.length === 0) {
      return NextResponse.json(
        { error: "No confirmed mappings found. Go back and confirm mappings first." },
        { status: 400 }
      );
    }

    // Fetch creative details
    const { data: creatives, error: crErr } = await supabase
      .from("creatives")
      .select("id, filename, storage_path")
      .in("id", creativeIds);

    if (crErr || !creatives?.length) {
      return NextResponse.json(
        { error: "Failed to fetch creatives" },
        { status: 500 }
      );
    }

    // Build the extraction tool
    const variables = schema.variables as VariableDefinition[];
    const tool = buildExtractionTool(variables);
    const enabledCount = variables.filter((v) => v.enabled).length;

    // Create analysis run
    const { data: run, error: runErr } = await supabase
      .from("analysis_runs")
      .insert({
        project_id: projectId,
        schema_id: schemaId,
        status: "running",
        total_creatives: creatives.length,
        completed_creatives: 0,
        failed_creatives: 0,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (runErr || !run) {
      return NextResponse.json(
        { error: "Failed to create analysis run" },
        { status: 500 }
      );
    }

    // Stream progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(JSON.stringify(data) + "\n")
          );
        };

        send({
          type: "start",
          runId: run.id,
          total: creatives.length,
          variables: enabledCount,
        });

        let completed = 0;
        let failed = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        let totalCost = 0;

        // Haiku 4.5 pricing: $0.80/M input, $4.00/M output
        const INPUT_COST_PER_TOKEN = 0.8 / 1_000_000;
        const OUTPUT_COST_PER_TOKEN = 4.0 / 1_000_000;

        for (const creative of creatives) {
          try {
            const imageUrl = getImageUrl(creative.storage_path);

            const result = await analyseCreative(
              anthropic,
              imageUrl,
              tool,
              brandContext
            );

            const cost =
              result.inputTokens * INPUT_COST_PER_TOKEN +
              result.outputTokens * OUTPUT_COST_PER_TOKEN;

            // Save extraction result
            await supabase.from("extraction_results").insert({
              run_id: run.id,
              creative_id: creative.id,
              extracted_variables: result.extracted,
              input_tokens: result.inputTokens,
              output_tokens: result.outputTokens,
              cost,
              duration_ms: result.durationMs,
              status: "completed",
            });

            completed++;
            totalInputTokens += result.inputTokens;
            totalOutputTokens += result.outputTokens;
            totalCost += cost;

            send({
              type: "progress",
              creativeId: creative.id,
              filename: creative.filename,
              completed,
              failed,
              total: creatives.length,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              cost: Math.round(cost * 10000) / 10000,
              totalCost: Math.round(totalCost * 10000) / 10000,
              durationMs: result.durationMs,
              extracted: result.extracted,
            });
          } catch (err) {
            failed++;
            const errorMsg =
              err instanceof Error ? err.message : "Unknown error";

            await supabase.from("extraction_results").insert({
              run_id: run.id,
              creative_id: creative.id,
              extracted_variables: {},
              status: "failed",
              error_message: errorMsg,
            });

            send({
              type: "error",
              creativeId: creative.id,
              filename: creative.filename,
              error: errorMsg,
              completed,
              failed,
              total: creatives.length,
            });
          }

          // Update run progress
          await supabase
            .from("analysis_runs")
            .update({
              completed_creatives: completed,
              failed_creatives: failed,
              total_input_tokens: totalInputTokens,
              total_output_tokens: totalOutputTokens,
              total_cost: totalCost,
            })
            .eq("id", run.id);
        }

        // Mark run as completed
        await supabase
          .from("analysis_runs")
          .update({
            status: failed === creatives.length ? "failed" : "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", run.id);

        send({
          type: "done",
          runId: run.id,
          completed,
          failed,
          total: creatives.length,
          totalInputTokens,
          totalOutputTokens,
          totalCost: Math.round(totalCost * 10000) / 10000,
        });

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analysis?projectId=... — Fetch the latest analysis run and results.
 */
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // Get latest run
    const { data: run, error: runErr } = await supabase
      .from("analysis_runs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (runErr) {
      return NextResponse.json(
        { error: runErr.message },
        { status: 500 }
      );
    }

    if (!run) {
      return NextResponse.json({ run: null, results: [] });
    }

    // Get results for this run
    const { data: results, error: resErr } = await supabase
      .from("extraction_results")
      .select("*")
      .eq("run_id", run.id)
      .order("created_at", { ascending: true });

    if (resErr) {
      return NextResponse.json(
        { error: resErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ run, results: results ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

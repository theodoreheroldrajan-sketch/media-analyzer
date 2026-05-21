import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

/**
 * GET /api/settings?projectId=... — Fetch usage stats for a project.
 */
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const supabase = getServerSupabase();

    // Analysis runs
    const { data: runs } = await supabase
      .from("analysis_runs")
      .select("id, total_input_tokens, total_output_tokens, total_cost, completed_at, status")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    const totalRuns = runs?.length ?? 0;
    const totalTokens = (runs ?? []).reduce(
      (s, r) => s + (r.total_input_tokens ?? 0) + (r.total_output_tokens ?? 0),
      0
    );
    const totalCost = (runs ?? []).reduce(
      (s, r) => s + (r.total_cost ?? 0),
      0
    );
    const lastRun = runs?.[0]?.completed_at ?? null;

    // Counts for export info
    const { count: creativeCount } = await supabase
      .from("creatives")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const { count: perfRowCount } = await supabase
      .from("performance_rows")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("is_latest", true);

    // Get latest completed run for extraction count
    const latestRun = (runs ?? []).find((r) => r.status === "completed");
    let extractionCount = 0;
    let variableCount = 0;

    if (latestRun) {
      const { count } = await supabase
        .from("extraction_results")
        .select("*", { count: "exact", head: true })
        .eq("run_id", latestRun.id)
        .eq("status", "completed");
      extractionCount = count ?? 0;

      // Get variable count from schema
      const { data: run } = await supabase
        .from("analysis_runs")
        .select("schema_id")
        .eq("id", latestRun.id)
        .single();

      if (run) {
        const { data: schema } = await supabase
          .from("variable_schemas")
          .select("variables")
          .eq("id", run.schema_id)
          .single();

        if (schema) {
          const vars = schema.variables as { enabled: boolean }[];
          variableCount = vars.filter((v) => v.enabled).length;
        }
      }
    }

    return NextResponse.json({
      usage: {
        totalRuns,
        totalTokens,
        totalCost: Math.round(totalCost * 10000) / 10000,
        lastRun,
      },
      exports: {
        creativeCount: creativeCount ?? 0,
        perfRowCount: perfRowCount ?? 0,
        extractionCount,
        variableCount,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

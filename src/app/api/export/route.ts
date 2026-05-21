import { NextRequest, NextResponse } from "next/server";
import type { VariableDefinition } from "@/types/database";
import { getServerSupabase } from "@/lib/supabase";

function escapeCSV(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: unknown[][]): string {
  const header = headers.map(escapeCSV).join(",");
  const body = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
  return header + "\n" + body;
}

/**
 * GET /api/export?projectId=...&type=variables|performance|combined
 *
 * Returns a CSV file as a downloadable response.
 */
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    const type = request.nextUrl.searchParams.get("type");

    if (!projectId || !type) {
      return NextResponse.json(
        { error: "Missing projectId or type" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    if (type === "variables") {
      // Export extracted variables for each creative
      const { data: latestRun } = await supabase
        .from("analysis_runs")
        .select("id, schema_id")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestRun) {
        return NextResponse.json(
          { error: "No completed analysis run" },
          { status: 404 }
        );
      }

      const { data: results } = await supabase
        .from("extraction_results")
        .select("creative_id, extracted_variables")
        .eq("run_id", latestRun.id)
        .eq("status", "completed");

      const { data: schema } = await supabase
        .from("variable_schemas")
        .select("variables")
        .eq("id", latestRun.schema_id)
        .single();

      const variables = ((schema?.variables ?? []) as VariableDefinition[]).filter(
        (v) => v.enabled
      );
      const varNames = variables.map((v) => v.name);

      // Get filenames
      const creativeIds = (results ?? []).map((r) => r.creative_id);
      const { data: creatives } = await supabase
        .from("creatives")
        .select("id, filename")
        .in("id", creativeIds.length > 0 ? creativeIds : ["__none__"]);

      const nameMap = new Map((creatives ?? []).map((c) => [c.id, c.filename]));

      const headers = ["filename", ...varNames];
      const rows = (results ?? []).map((r) => {
        const vars = r.extracted_variables as Record<string, unknown>;
        return [
          nameMap.get(r.creative_id) ?? r.creative_id,
          ...varNames.map((name) => vars[name] ?? ""),
        ];
      });

      const csv = toCSV(headers, rows);

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="variables-export.csv"`,
        },
      });
    }

    if (type === "performance") {
      // Export performance rows
      const { data: perfRows } = await supabase
        .from("performance_rows")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_latest", true);

      const headers = [
        "source_filename",
        "source_ad_id",
        "source_ad_name",
        "impressions",
        "clicks",
        "spend",
        "conversions",
        "revenue",
        "campaign_name",
        "platform",
        "date_start",
        "date_end",
      ];

      const rows = (perfRows ?? []).map((r) => [
        r.source_filename,
        r.source_ad_id,
        r.source_ad_name,
        r.impressions,
        r.clicks,
        r.spend,
        r.conversions,
        r.revenue,
        r.campaign_name,
        r.platform,
        r.date_start,
        r.date_end,
      ]);

      const csv = toCSV(headers, rows);

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="performance-export.csv"`,
        },
      });
    }

    if (type === "combined") {
      // Export combined: creative filename + extracted vars + performance metrics
      const { data: latestRun } = await supabase
        .from("analysis_runs")
        .select("id, schema_id")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestRun) {
        return NextResponse.json(
          { error: "No completed analysis run" },
          { status: 404 }
        );
      }

      const { data: results } = await supabase
        .from("extraction_results")
        .select("creative_id, extracted_variables")
        .eq("run_id", latestRun.id)
        .eq("status", "completed");

      const { data: schema } = await supabase
        .from("variable_schemas")
        .select("variables")
        .eq("id", latestRun.schema_id)
        .single();

      const variables = ((schema?.variables ?? []) as VariableDefinition[]).filter(
        (v) => v.enabled
      );
      const varNames = variables.map((v) => v.name);

      // Get mappings
      const { data: mappings } = await supabase
        .from("creative_mappings")
        .select("creative_id, performance_row_id")
        .eq("project_id", projectId)
        .eq("status", "confirmed");

      const creativeToPerfMap = new Map(
        (mappings ?? []).map((m) => [m.creative_id, m.performance_row_id])
      );

      // Get perf rows — latest snapshot only
      const perfIds = [...new Set((mappings ?? []).map((m) => m.performance_row_id))];
      const { data: perfRows } = await supabase
        .from("performance_rows")
        .select("id, impressions, clicks, spend, conversions, revenue")
        .in("id", perfIds.length > 0 ? perfIds : ["__none__"])
        .eq("is_latest", true);

      const perfMap = new Map((perfRows ?? []).map((p) => [p.id, p]));

      // Get filenames
      const creativeIds = (results ?? []).map((r) => r.creative_id);
      const { data: creatives } = await supabase
        .from("creatives")
        .select("id, filename")
        .in("id", creativeIds.length > 0 ? creativeIds : ["__none__"]);

      const nameMap = new Map((creatives ?? []).map((c) => [c.id, c.filename]));

      const headers = [
        "filename",
        ...varNames,
        "impressions",
        "clicks",
        "spend",
        "conversions",
        "revenue",
        "ctr",
        "cpc",
      ];

      const rows = (results ?? []).map((r) => {
        const vars = r.extracted_variables as Record<string, unknown>;
        const perfId = creativeToPerfMap.get(r.creative_id);
        const perf = perfId ? perfMap.get(perfId) : null;

        const impressions = perf?.impressions ?? 0;
        const clicks = perf?.clicks ?? 0;
        const spend = perf?.spend ?? 0;
        const conversions = perf?.conversions ?? 0;
        const revenue = perf?.revenue ?? 0;
        const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(4) : "";
        const cpc = clicks > 0 ? (spend / clicks).toFixed(4) : "";

        return [
          nameMap.get(r.creative_id) ?? r.creative_id,
          ...varNames.map((name) => vars[name] ?? ""),
          impressions,
          clicks,
          spend,
          conversions,
          revenue,
          ctr,
          cpc,
        ];
      });

      const csv = toCSV(headers, rows);

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="combined-analysis-export.csv"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid export type. Use: variables, performance, combined" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

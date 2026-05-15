import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database, VariableDefinition } from "@/types/database";
import {
  computeKeyMetrics,
  computeVariablePerformance,
  computeTrustScore,
  type CreativeData,
  type MetricKey,
} from "@/lib/analytics";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase environment variables");
  return createClient<Database>(url, key);
}

/**
 * GET /api/dashboard?projectId=...&metric=ctr
 *
 * Assembles all dashboard data:
 * - Key metrics
 * - Variable performance (group-by)
 * - Trust score
 * - Creative gallery data
 */
export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");
    const metric = (request.nextUrl.searchParams.get("metric") ?? "ctr") as MetricKey;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // 1. Get latest completed analysis run
    const { data: run } = await supabase
      .from("analysis_runs")
      .select("id, schema_id, total_creatives, completed_creatives, failed_creatives")
      .eq("project_id", projectId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!run) {
      return NextResponse.json({
        hasData: false,
        message: "No completed analysis run found.",
      });
    }

    // 2. Get extraction results
    const { data: extractions } = await supabase
      .from("extraction_results")
      .select("creative_id, extracted_variables, confidence, status")
      .eq("run_id", run.id)
      .eq("status", "completed");

    if (!extractions || extractions.length === 0) {
      return NextResponse.json({
        hasData: false,
        message: "No extraction results found.",
      });
    }

    // 3. Get confirmed mappings to link creatives → performance
    const { data: mappings } = await supabase
      .from("creative_mappings")
      .select("creative_id, performance_row_id")
      .eq("project_id", projectId)
      .eq("status", "confirmed");

    // Build creative → performance_row_id map
    const creativeToPerfMap = new Map<string, string>();
    for (const m of mappings ?? []) {
      creativeToPerfMap.set(m.creative_id, m.performance_row_id);
    }

    // 4. Get performance rows — latest snapshot only
    const perfIds = [...new Set((mappings ?? []).map((m) => m.performance_row_id))];
    const { data: perfRows } = await supabase
      .from("performance_rows")
      .select(
        "id, impressions, clicks, spend, conversions, revenue, is_latest"
      )
      .in("id", perfIds.length > 0 ? perfIds : ["__none__"])
      .eq("is_latest", true);

    const perfMap = new Map(
      (perfRows ?? []).map((p) => [p.id, p])
    );

    // 4b. Snapshot indicator info — current and total upload count
    const { data: uploadList } = await supabase
      .from("performance_uploads")
      .select("snapshot_number")
      .eq("project_id", projectId)
      .order("snapshot_number", { ascending: false });

    const totalSnapshots = uploadList?.length ?? 0;
    const currentSnapshot = uploadList?.[0]?.snapshot_number ?? 0;

    // 5. Get creative filenames
    const creativeIds = extractions.map((e) => e.creative_id);
    const { data: creatives } = await supabase
      .from("creatives")
      .select("id, filename")
      .in("id", creativeIds);

    const filenameMap = new Map(
      (creatives ?? []).map((c) => [c.id, c.filename])
    );

    // 6. Build CreativeData array
    const creativeData: CreativeData[] = [];

    for (const ext of extractions) {
      const perfRowId = creativeToPerfMap.get(ext.creative_id);
      if (!perfRowId) continue;

      const perf = perfMap.get(perfRowId);
      if (!perf) continue;

      creativeData.push({
        creativeId: ext.creative_id,
        filename: filenameMap.get(ext.creative_id) ?? "—",
        extractedVariables: ext.extracted_variables as Record<string, unknown>,
        impressions: perf.impressions ?? 0,
        clicks: perf.clicks ?? 0,
        spend: perf.spend ?? 0,
        conversions: perf.conversions ?? 0,
        revenue: perf.revenue ?? 0,
      });
    }

    // 7. Get the variable schema to know which variables to analyse,
    //    plus the project row for hypothesis (pre-registered) variables.
    const [{ data: schema }, { data: projectRow }] = await Promise.all([
      supabase
        .from("variable_schemas")
        .select("variables")
        .eq("id", run.schema_id)
        .single(),
      supabase
        .from("projects")
        .select("pre_registered_variables")
        .eq("id", projectId)
        .single(),
    ]);

    const hypothesisVariables = Array.isArray(
      projectRow?.pre_registered_variables
    )
      ? (projectRow.pre_registered_variables as string[])
      : [];

    const variables = (schema?.variables as VariableDefinition[]) ?? [];
    const enabledVarNames = variables
      .filter((v) => v.enabled)
      .map((v) => v.name);

    // 8. Compute everything
    const keyMetrics = computeKeyMetrics(creativeData);
    const variablePerformance = computeVariablePerformance(
      creativeData,
      enabledVarNames,
      metric
    );

    // Data completeness: what % of creatives have all key performance fields
    const completenessCount = creativeData.filter(
      (d) => d.impressions > 0 && d.spend > 0
    ).length;
    const dataCompletenessPct =
      creativeData.length > 0
        ? (completenessCount / creativeData.length) * 100
        : 0;

    // Mapping quality: confirmed mappings vs total creatives
    const { count: totalCreatives } = await supabase
      .from("creatives")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const mappingPct =
      (totalCreatives ?? 0) > 0
        ? ((mappings?.length ?? 0) / (totalCreatives ?? 1)) * 100
        : 0;

    // Average extraction confidence
    const avgConfidence =
      extractions.length > 0
        ? extractions.reduce((s, e) => s + (e.confidence ?? 0.8), 0) /
          extractions.length
        : 0;

    const trustScore = computeTrustScore(
      creativeData.length,
      keyMetrics.totalImpressions,
      mappingPct,
      dataCompletenessPct,
      avgConfidence,
      variablePerformance
    );

    // 9. Creative gallery: sorted by the chosen metric
    const gallery = creativeData
      .map((d) => {
        const imp = d.impressions || 1;
        const metricVal =
          metric === "ctr"
            ? (d.clicks / imp) * 100
            : metric === "cpc"
              ? d.clicks > 0
                ? d.spend / d.clicks
                : 0
              : metric === "cpa"
                ? d.conversions > 0
                  ? d.spend / d.conversions
                  : 0
                : metric === "cvr"
                  ? d.clicks > 0
                    ? (d.conversions / d.clicks) * 100
                    : 0
                  : d.spend > 0
                    ? d.revenue / d.spend
                    : 0;

        return {
          creativeId: d.creativeId,
          filename: d.filename,
          metricValue: metricVal,
          impressions: d.impressions,
          clicks: d.clicks,
          spend: d.spend,
        };
      })
      .sort((a, b) => {
        // For CPC and CPA, lower is better
        if (metric === "cpc" || metric === "cpa") {
          return a.metricValue - b.metricValue;
        }
        return b.metricValue - a.metricValue;
      });

    return NextResponse.json({
      hasData: true,
      keyMetrics,
      variablePerformance,
      trustScore,
      gallery,
      totalCreatives: totalCreatives ?? 0,
      regressionReady: creativeData.length >= 100,
      creativeCount: creativeData.length,
      regressionThreshold: 100,
      hypothesisVariables,
      currentSnapshot,
      totalSnapshots,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

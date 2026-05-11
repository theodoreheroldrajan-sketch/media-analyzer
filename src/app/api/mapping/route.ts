import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { runMatching } from "@/lib/matching";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(url, key);
}

/**
 * POST /api/mapping — Run the matching engine for a project.
 * Deletes existing pending/confirmed mappings and re-runs from scratch.
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    // Fetch creatives
    const { data: creatives, error: cErr } = await supabase
      .from("creatives")
      .select("id, filename")
      .eq("project_id", projectId);

    if (cErr) {
      return NextResponse.json(
        { error: `Failed to fetch creatives: ${cErr.message}` },
        { status: 500 }
      );
    }

    // Fetch latest performance rows
    const { data: perfRows, error: pErr } = await supabase
      .from("performance_rows")
      .select(
        "id, source_filename, source_ad_id, source_creative_id, source_ad_name, source_creative_name"
      )
      .eq("project_id", projectId)
      .eq("is_latest", true);

    if (pErr) {
      return NextResponse.json(
        { error: `Failed to fetch performance rows: ${pErr.message}` },
        { status: 500 }
      );
    }

    if (!creatives?.length || !perfRows?.length) {
      return NextResponse.json({
        auto: [],
        suggested: [],
        unmatchedCreatives: creatives ?? [],
        unmatchedPerformance: perfRows ?? [],
        message: "Need both creatives and performance data to run matching.",
      });
    }

    // Run matching engine
    const result = runMatching(creatives, perfRows);

    // Clear existing mappings for this project
    await supabase
      .from("creative_mappings")
      .delete()
      .eq("project_id", projectId);

    // Insert auto matches (status: confirmed)
    if (result.auto.length > 0) {
      const { error: autoErr } = await supabase
        .from("creative_mappings")
        .insert(
          result.auto.map((m) => ({
            project_id: projectId,
            creative_id: m.creativeId,
            performance_row_id: m.performanceRowId,
            match_method: m.method,
            match_confidence: m.confidence,
            status: "confirmed",
          }))
        );

      if (autoErr) {
        return NextResponse.json(
          { error: `Failed to insert auto matches: ${autoErr.message}` },
          { status: 500 }
        );
      }
    }

    // Insert suggested matches (status: pending)
    if (result.suggested.length > 0) {
      const { error: sugErr } = await supabase
        .from("creative_mappings")
        .insert(
          result.suggested.map((m) => ({
            project_id: projectId,
            creative_id: m.creativeId,
            performance_row_id: m.performanceRowId,
            match_method: m.method,
            match_confidence: m.confidence,
            status: "pending",
          }))
        );

      if (sugErr) {
        return NextResponse.json(
          { error: `Failed to insert suggested matches: ${sugErr.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      auto: result.auto,
      suggested: result.suggested,
      unmatchedCreatives: result.unmatchedCreatives,
      unmatchedPerformance: result.unmatchedPerformance,
      totalCreatives: creatives.length,
      totalPerformanceRows: perfRows.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mapping — Update a single mapping's status (confirm/reject).
 */
export async function PATCH(request: NextRequest) {
  try {
    const { mappingId, status } = await request.json();

    if (!mappingId || !["confirmed", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid mappingId or status" },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();

    const { error } = await supabase
      .from("creative_mappings")
      .update({ status })
      .eq("id", mappingId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

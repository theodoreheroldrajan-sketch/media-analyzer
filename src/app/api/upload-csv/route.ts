import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

type CSVUploadBody = {
  projectId: string;
  filename: string;
  headers: string[];
  rows: Record<string, string | number | null>[];
  extraColumns: Record<string, unknown>[];
};

const MAX_ROWS = 10_000;

export async function POST(request: NextRequest) {
  try {
    const body: CSVUploadBody = await request.json();
    const { projectId, filename, headers, rows, extraColumns } = body;

    if (!projectId || !rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Missing projectId or empty rows" },
        { status: 400 }
      );
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        {
          error: `Too many rows (${rows.length}). Maximum is ${MAX_ROWS}.`,
        },
        { status: 413 }
      );
    }

    const supabase = getServerSupabase();

    // 1. Determine snapshot number
    const { data: latestUpload } = await supabase
      .from("performance_uploads")
      .select("snapshot_number")
      .eq("project_id", projectId)
      .order("snapshot_number", { ascending: false })
      .limit(1)
      .single();

    const snapshotNumber = (latestUpload?.snapshot_number ?? 0) + 1;

    // 2. Mark old performance rows as not latest
    await supabase
      .from("performance_rows")
      .update({ is_latest: false })
      .eq("project_id", projectId)
      .eq("is_latest", true);

    // 3. Insert performance_uploads metadata
    const { data: upload, error: uploadError } = await supabase
      .from("performance_uploads")
      .insert({
        project_id: projectId,
        original_filename: filename,
        row_count: rows.length,
        columns_detected: headers,
        validation_status: "valid",
        validation_details: {},
        snapshot_number: snapshotNumber,
      })
      .select("id")
      .single();

    if (uploadError || !upload) {
      return NextResponse.json(
        { error: `Upload metadata failed: ${uploadError?.message}` },
        { status: 500 }
      );
    }

    // 4. Insert performance rows in batches of 100
    const BATCH_SIZE = 100;
    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).map((row, idx) => ({
        upload_id: upload.id,
        project_id: projectId,
        source_filename: (row.source_filename as string) ?? null,
        source_creative_id: (row.source_creative_id as string) ?? null,
        source_ad_id: (row.source_ad_id as string) ?? null,
        source_asset_id: (row.source_asset_id as string) ?? null,
        source_ad_name: (row.source_ad_name as string) ?? null,
        source_creative_name: (row.source_creative_name as string) ?? null,
        impressions: row.impressions as number | null,
        clicks: row.clicks as number | null,
        spend: row.spend as number | null,
        conversions: row.conversions as number | null,
        revenue: row.revenue as number | null,
        date_start: (row.date_start as string) ?? null,
        date_end: (row.date_end as string) ?? null,
        campaign_name: (row.campaign_name as string) ?? null,
        adset_name: (row.adset_name as string) ?? null,
        platform: (row.platform as string) ?? null,
        placement: (row.placement as string) ?? null,
        snapshot_number: snapshotNumber,
        is_latest: true,
        extra_columns: extraColumns[i + idx] ?? {},
      }));

      const { error: batchError } = await supabase
        .from("performance_rows")
        .insert(batch);

      if (batchError) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchError.message}`);
      } else {
        insertedCount += batch.length;
      }
    }

    return NextResponse.json({
      uploadId: upload.id,
      snapshotNumber,
      insertedRows: insertedCount,
      totalRows: rows.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

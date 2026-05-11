import { getSupabase } from "@/lib/supabase";
import Papa from "papaparse";

/**
 * Upload a single creative image to Supabase Storage and insert a row
 * in the creatives table.
 */
export async function uploadCreative(
  projectId: string,
  file: File
): Promise<{ id: string; filename: string } | { error: string }> {
  const supabase = getSupabase();

  // Build storage path: {projectId}/{filename}
  const storagePath = `${projectId}/${file.name}`;

  // Upload to storage
  const { error: storageError } = await supabase.storage
    .from("creatives")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: true, // Allow re-upload of same filename
    });

  if (storageError) {
    return { error: `Storage upload failed: ${storageError.message}` };
  }

  // Insert or update row in creatives table
  const { data, error: dbError } = await supabase
    .from("creatives")
    .upsert(
      {
        project_id: projectId,
        filename: file.name,
        storage_path: storagePath,
        media_type: file.type,
        file_size_bytes: file.size,
      },
      { onConflict: "project_id,filename" }
    )
    .select("id, filename")
    .single();

  if (dbError) {
    return { error: `Database insert failed: ${dbError.message}` };
  }

  return { id: data.id, filename: data.filename };
}

/**
 * Parse a CSV file client-side and return headers + rows.
 */
export function parseCSV(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[]; rowCount: number }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (results.errors.length > 0) {
          reject(
            new Error(
              `CSV parse errors: ${results.errors.map((e) => e.message).join(", ")}`
            )
          );
          return;
        }
        resolve({
          headers: results.meta.fields ?? [],
          rows: results.data,
          rowCount: results.data.length,
        });
      },
      error(err: Error) {
        reject(err);
      },
    });
  });
}

// Known column name mappings — normalise various ad platform column names
// to our internal schema fields
const COLUMN_MAP: Record<string, string> = {
  // Filename / creative identifier
  filename: "source_filename",
  file_name: "source_filename",
  creative_filename: "source_filename",
  image_name: "source_filename",
  asset_name: "source_filename",
  // Ad platform IDs
  ad_id: "source_ad_id",
  adid: "source_ad_id",
  creative_id: "source_creative_id",
  creativeid: "source_creative_id",
  asset_id: "source_asset_id",
  // Names
  ad_name: "source_ad_name",
  adname: "source_ad_name",
  creative_name: "source_creative_name",
  // Metrics
  impressions: "impressions",
  imps: "impressions",
  clicks: "clicks",
  spend: "spend",
  cost: "spend",
  amount_spent: "spend",
  conversions: "conversions",
  results: "conversions",
  revenue: "revenue",
  value: "revenue",
  conversion_value: "revenue",
  purchase_value: "revenue",
  // Dates
  date_start: "date_start",
  start_date: "date_start",
  date: "date_start",
  reporting_starts: "date_start",
  date_end: "date_end",
  end_date: "date_end",
  reporting_ends: "date_end",
  // Context
  campaign_name: "campaign_name",
  campaign: "campaign_name",
  adset_name: "adset_name",
  ad_set_name: "adset_name",
  ad_group: "adset_name",
  platform: "platform",
  publisher_platform: "platform",
  placement: "placement",
};

/**
 * Map a CSV row's columns to our internal schema using fuzzy column matching.
 * Known columns go to typed fields; unknown columns go to extra_columns.
 */
export function mapCSVRow(
  row: Record<string, string>,
  headers: string[]
): {
  mapped: Record<string, string | number | null>;
  extra: Record<string, unknown>;
} {
  const mapped: Record<string, string | number | null> = {};
  const extra: Record<string, unknown> = {};

  for (const header of headers) {
    const normalised = header.toLowerCase().trim().replace(/\s+/g, "_");
    const internalField = COLUMN_MAP[normalised];
    const value = row[header];

    if (internalField) {
      // Numeric fields
      if (
        ["impressions", "clicks", "spend", "conversions", "revenue"].includes(
          internalField
        )
      ) {
        const num = parseFloat(value);
        mapped[internalField] = isNaN(num) ? null : num;
      } else {
        mapped[internalField] = value || null;
      }
    } else {
      extra[header] = value || null;
    }
  }

  return { mapped, extra };
}

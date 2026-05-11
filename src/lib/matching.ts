/**
 * Creative ↔ Performance row matching engine.
 *
 * Six methods in cascade order (highest confidence first):
 * 1. Exact filename match
 * 2. Filename without extension
 * 3. Ad platform ID embedded in filename
 * 4. Prefix match (filename starts with source identifier)
 * 5. Contains match (filename contains source identifier)
 * 6. Fuzzy similarity (Levenshtein)
 */

export type MatchMethod =
  | "exact_filename"
  | "filename_no_ext"
  | "platform_id"
  | "prefix"
  | "contains"
  | "fuzzy";

export type MatchResult = {
  creativeId: string;
  creativeFilename: string;
  performanceRowId: string;
  performanceIdentifier: string;
  method: MatchMethod;
  confidence: number; // 0-1
};

type CreativeRef = { id: string; filename: string };
type PerfRef = {
  id: string;
  source_filename: string | null;
  source_ad_id: string | null;
  source_creative_id: string | null;
  source_ad_name: string | null;
  source_creative_name: string | null;
};

/** Strip file extension */
function stripExt(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

/** Normalise for comparison: lowercase, trim, strip common prefixes/suffixes */
function normalise(s: string): string {
  return s.toLowerCase().trim().replace(/[_\-\s]+/g, "");
}

/** Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

/** Similarity score (0-1) based on Levenshtein distance */
function similarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  const maxLen = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Get all identifiers from a performance row that could match a filename.
 * Returns [identifier, label] pairs.
 */
function getIdentifiers(row: PerfRef): [string, string][] {
  const ids: [string, string][] = [];
  if (row.source_filename) ids.push([row.source_filename, "source_filename"]);
  if (row.source_ad_id) ids.push([row.source_ad_id, "source_ad_id"]);
  if (row.source_creative_id)
    ids.push([row.source_creative_id, "source_creative_id"]);
  if (row.source_ad_name) ids.push([row.source_ad_name, "source_ad_name"]);
  if (row.source_creative_name)
    ids.push([row.source_creative_name, "source_creative_name"]);
  return ids;
}

/**
 * Run the full matching cascade.
 * Returns matches grouped by quality: auto (high confidence), suggested, unmatched.
 */
export function runMatching(
  creatives: CreativeRef[],
  performanceRows: PerfRef[]
): {
  auto: MatchResult[];
  suggested: MatchResult[];
  unmatchedCreatives: CreativeRef[];
  unmatchedPerformance: PerfRef[];
} {
  const auto: MatchResult[] = [];
  const suggested: MatchResult[] = [];

  const matchedCreativeIds = new Set<string>();
  const matchedPerfIds = new Set<string>();

  // Helper: record a match if neither side is already matched
  function tryMatch(
    creative: CreativeRef,
    perf: PerfRef,
    identifier: string,
    method: MatchMethod,
    confidence: number,
    bucket: MatchResult[]
  ): boolean {
    if (matchedCreativeIds.has(creative.id) || matchedPerfIds.has(perf.id)) {
      return false;
    }
    bucket.push({
      creativeId: creative.id,
      creativeFilename: creative.filename,
      performanceRowId: perf.id,
      performanceIdentifier: identifier,
      method,
      confidence,
    });
    matchedCreativeIds.add(creative.id);
    matchedPerfIds.add(perf.id);
    return true;
  }

  // Pass 1: Exact filename match (confidence: 1.0)
  for (const creative of creatives) {
    for (const perf of performanceRows) {
      for (const [identifier] of getIdentifiers(perf)) {
        if (normalise(creative.filename) === normalise(identifier)) {
          tryMatch(creative, perf, identifier, "exact_filename", 1.0, auto);
          break;
        }
      }
    }
  }

  // Pass 2: Filename without extension (confidence: 0.95)
  for (const creative of creatives) {
    if (matchedCreativeIds.has(creative.id)) continue;
    const noExt = normalise(stripExt(creative.filename));
    for (const perf of performanceRows) {
      if (matchedPerfIds.has(perf.id)) continue;
      for (const [identifier] of getIdentifiers(perf)) {
        const normId = normalise(stripExt(identifier));
        if (noExt === normId && noExt.length > 0) {
          tryMatch(creative, perf, identifier, "filename_no_ext", 0.95, auto);
          break;
        }
      }
    }
  }

  // Pass 3: Platform ID in filename (confidence: 0.85)
  for (const creative of creatives) {
    if (matchedCreativeIds.has(creative.id)) continue;
    const normFilename = normalise(creative.filename);
    for (const perf of performanceRows) {
      if (matchedPerfIds.has(perf.id)) continue;
      // Only check ad_id and creative_id fields
      const ids: [string, string][] = [];
      if (perf.source_ad_id) ids.push([perf.source_ad_id, "source_ad_id"]);
      if (perf.source_creative_id)
        ids.push([perf.source_creative_id, "source_creative_id"]);

      for (const [id, label] of ids) {
        const normId = normalise(id);
        if (normId.length >= 4 && normFilename.includes(normId)) {
          tryMatch(creative, perf, `${label}:${id}`, "platform_id", 0.85, auto);
          break;
        }
      }
    }
  }

  // Pass 4: Prefix match (confidence: 0.7)
  for (const creative of creatives) {
    if (matchedCreativeIds.has(creative.id)) continue;
    const normFilename = normalise(stripExt(creative.filename));
    for (const perf of performanceRows) {
      if (matchedPerfIds.has(perf.id)) continue;
      for (const [identifier] of getIdentifiers(perf)) {
        const normId = normalise(identifier);
        if (
          normId.length >= 4 &&
          (normFilename.startsWith(normId) || normId.startsWith(normFilename))
        ) {
          tryMatch(creative, perf, identifier, "prefix", 0.7, suggested);
          break;
        }
      }
    }
  }

  // Pass 5: Contains match (confidence: 0.55)
  for (const creative of creatives) {
    if (matchedCreativeIds.has(creative.id)) continue;
    const normFilename = normalise(stripExt(creative.filename));
    for (const perf of performanceRows) {
      if (matchedPerfIds.has(perf.id)) continue;
      for (const [identifier] of getIdentifiers(perf)) {
        const normId = normalise(identifier);
        if (
          normId.length >= 4 &&
          (normFilename.includes(normId) || normId.includes(normFilename))
        ) {
          tryMatch(creative, perf, identifier, "contains", 0.55, suggested);
          break;
        }
      }
    }
  }

  // Pass 6: Fuzzy match (confidence: similarity score * 0.5, only if > 0.6)
  for (const creative of creatives) {
    if (matchedCreativeIds.has(creative.id)) continue;
    const normFilename = normalise(stripExt(creative.filename));
    let bestMatch: {
      perf: PerfRef;
      identifier: string;
      score: number;
    } | null = null;

    for (const perf of performanceRows) {
      if (matchedPerfIds.has(perf.id)) continue;
      for (const [identifier] of getIdentifiers(perf)) {
        const normId = normalise(stripExt(identifier));
        const score = similarity(normFilename, normId);
        if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { perf, identifier, score };
        }
      }
    }

    if (bestMatch) {
      tryMatch(
        creative,
        bestMatch.perf,
        bestMatch.identifier,
        "fuzzy",
        Math.round(bestMatch.score * 50) / 100, // Scale to 0-0.5 range
        suggested
      );
    }
  }

  // Collect unmatched
  const unmatchedCreatives = creatives.filter(
    (c) => !matchedCreativeIds.has(c.id)
  );
  const unmatchedPerformance = performanceRows.filter(
    (p) => !matchedPerfIds.has(p.id)
  );

  return { auto, suggested, unmatchedCreatives, unmatchedPerformance };
}

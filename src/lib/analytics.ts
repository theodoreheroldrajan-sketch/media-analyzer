/**
 * Group-by analytics engine.
 *
 * For each extracted variable, groups creatives by their value,
 * then computes aggregate metrics per group.
 *
 * This is the "current version" approach — simple group-by with averages.
 * Multiple regression analysis unlocks at 100+ creatives.
 */

import { createRng } from "./rng";

export type MetricKey = "ctr" | "cpc" | "cpa" | "cvr" | "roas";

export type CreativeData = {
  creativeId: string;
  filename: string;
  extractedVariables: Record<string, unknown>;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
};

export type VariablePerformance = {
  variable: string;
  value: string;
  count: number;
  avgMetric: number;
  overallAvg: number;
  delta: number; // percentage difference vs overall
  delta95Lower: number; // bootstrap 95% CI lower bound on delta
  delta95Upper: number; // bootstrap 95% CI upper bound on delta
  confidence: "high" | "medium" | "low" | "insufficient";
};

export type KeyMetrics = {
  creativesAnalysed: number;
  totalImpressions: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  totalRevenue: number;
  avgCTR: number;
  avgCPC: number;
  avgCPA: number;
  avgCVR: number;
  avgROAS: number;
};

/**
 * Noise-adjusted ranking for exploratory findings.
 * Penalises small-N findings even when their absolute delta is large.
 * Used to order "patterns to investigate" so a 30% delta from n=3
 * ranks below a 15% delta from n=20.
 */
export function noiseAdjustedRank(varPerf: VariablePerformance): number {
  return Math.abs(varPerf.delta) * Math.sqrt(varPerf.count);
}

/**
 * Benjamini–Hochberg false-discovery rate adjustment.
 * Takes an array of raw p-values, returns adjusted p-values aligned to
 * the input order. Used to control FDR on exploratory variables that
 * were not pre-registered as hypotheses.
 */
export function benjaminiHochberg(pValues: number[]): number[] {
  const n = pValues.length;
  if (n === 0) return [];

  // Pair p-values with their original index, then sort ascending
  const indexed = pValues.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => a.p - b.p);

  // Compute adjusted p-values, then enforce monotonicity from the largest down
  const adjusted = new Array<number>(n);
  let running = 1;
  for (let rank = n - 1; rank >= 0; rank--) {
    const raw = indexed[rank].p * n / (rank + 1);
    running = Math.min(running, raw);
    adjusted[indexed[rank].i] = Math.min(1, running);
  }
  return adjusted;
}

export type ModelStability = "green" | "yellow" | "red";

/**
 * Compute model-stability colour based on observations per predictor.
 * Green: 10+ obs/predictor. Yellow: 5-10. Red: under 5.
 * Independent of the Pro unlock threshold (still 100 creatives).
 */
export function computeModelStability(
  creativeCount: number,
  predictorCount: number
): ModelStability {
  if (predictorCount <= 0) return "red";
  const ratio = creativeCount / predictorCount;
  if (ratio >= 10) return "green";
  if (ratio >= 5) return "yellow";
  return "red";
}

/**
 * Count predictors from a list of enabled variable definitions.
 * - boolean: 1 predictor
 * - enum: (levels - 1) predictors (drop reference category for one-hot)
 * - integer: 1 predictor
 * - string: excluded (not modelled)
 */
export function countPredictors(
  vars: { type: "boolean" | "enum" | "integer" | "string"; values?: string[] }[]
): number {
  let count = 0;
  for (const v of vars) {
    if (v.type === "boolean") count += 1;
    else if (v.type === "integer") count += 1;
    else if (v.type === "enum") count += Math.max(0, (v.values?.length ?? 0) - 1);
    // string: skip
  }
  return count;
}

export type TrustScore = {
  overall: number;
  creativeCount: number;
  volumeScore: number;
  mappingQuality: number;
  dataCompleteness: number;
  bucketBalance: number;
  level: "excellent" | "good" | "fair" | "poor";
};

// ─── Trust-score named constants ─────────────────────────────────
// Curves: creative count scales linearly to 100 at TRUST_CREATIVE_COUNT_TARGET
// creatives; volume scales to 100 at 10^TRUST_VOLUME_LOG_DENOMINATOR
// impressions. Composite is floor-gated: the lowest of creative count,
// mapping quality, and data completeness caps the score; the upper score
// (volume + bucket balance) contributes proportionally on top.
const TRUST_CREATIVE_COUNT_TARGET = 50;
const TRUST_VOLUME_LOG_DENOMINATOR = 6;
const TRUST_COMPOSITE_VOLUME_WEIGHT = 0.5;
const TRUST_COMPOSITE_BUCKET_BALANCE_WEIGHT = 0.5;
const TRUST_THRESHOLD_EXCELLENT = 80;
const TRUST_THRESHOLD_GOOD = 60;
const TRUST_THRESHOLD_FAIR = 40;

/**
 * Compute key aggregate metrics from creative performance data.
 */
export function computeKeyMetrics(data: CreativeData[]): KeyMetrics {
  const n = data.length;
  if (n === 0) {
    return {
      creativesAnalysed: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalSpend: 0,
      totalConversions: 0,
      totalRevenue: 0,
      avgCTR: 0,
      avgCPC: 0,
      avgCPA: 0,
      avgCVR: 0,
      avgROAS: 0,
    };
  }

  const totalImpressions = data.reduce((s, d) => s + d.impressions, 0);
  const totalClicks = data.reduce((s, d) => s + d.clicks, 0);
  const totalSpend = data.reduce((s, d) => s + d.spend, 0);
  const totalConversions = data.reduce((s, d) => s + d.conversions, 0);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

  return {
    creativesAnalysed: n,
    totalImpressions,
    totalClicks,
    totalSpend,
    totalConversions,
    totalRevenue,
    avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    avgCPC: totalClicks > 0 ? totalSpend / totalClicks : 0,
    avgCPA: totalConversions > 0 ? totalSpend / totalConversions : 0,
    avgCVR: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    avgROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
  };
}

/**
 * Resample an array with replacement (bootstrap sampling).
 * When an rng is provided, sampling is deterministic.
 */
function resampleWithReplacement<T>(
  arr: T[],
  n: number,
  rng?: { next(): number }
): T[] {
  const out: T[] = new Array(n);
  const len = arr.length;
  for (let i = 0; i < n; i++) {
    out[i] = arr[Math.floor((rng ? rng.next() : Math.random()) * len)];
  }
  return out;
}

/**
 * Compute a 95% bootstrap confidence interval on the percentage delta
 * between a group's metric and the overall metric.
 *
 * Uses volume-weighted aggregation (via getMetricValue / sum-of-raws)
 * inside each bootstrap iteration.
 */
function bootstrapDeltaCI(
  group: CreativeData[],
  overall: CreativeData[],
  metric: MetricKey,
  iterations = 1000,
  seed?: number
): { lower95: number; upper95: number } {
  const rng = seed !== undefined ? createRng(seed) : undefined;
  const deltas: number[] = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    const groupSample = resampleWithReplacement(group, group.length, rng);
    const overallSample = resampleWithReplacement(overall, overall.length, rng);
    const g = getMetricValue(groupSample, metric);
    const o = getMetricValue(overallSample, metric);
    deltas[i] = o !== 0 ? ((g - o) / o) * 100 : 0;
  }

  deltas.sort((a, b) => a - b);
  const loIdx = Math.floor(deltas.length * 0.025);
  const hiIdx = Math.floor(deltas.length * 0.975);
  return { lower95: deltas[loIdx], upper95: deltas[hiIdx] };
}

/**
 * Get the metric value for a group of creatives.
 */
function getMetricValue(
  group: CreativeData[],
  metric: MetricKey
): number {
  const impressions = group.reduce((s, d) => s + d.impressions, 0);
  const clicks = group.reduce((s, d) => s + d.clicks, 0);
  const spend = group.reduce((s, d) => s + d.spend, 0);
  const conversions = group.reduce((s, d) => s + d.conversions, 0);
  const revenue = group.reduce((s, d) => s + d.revenue, 0);

  switch (metric) {
    case "ctr":
      return impressions > 0 ? (clicks / impressions) * 100 : 0;
    case "cpc":
      return clicks > 0 ? spend / clicks : 0;
    case "cpa":
      return conversions > 0 ? spend / conversions : 0;
    case "cvr":
      return clicks > 0 ? (conversions / clicks) * 100 : 0;
    case "roas":
      return spend > 0 ? revenue / spend : 0;
  }
}

/**
 * Compute group-by variable performance.
 *
 * For each variable, groups creatives by their extracted value,
 * computes the chosen metric per group, and compares to the overall average.
 */
export function computeVariablePerformance(
  data: CreativeData[],
  variableNames: string[],
  metric: MetricKey,
  seed?: number
): VariablePerformance[] {
  if (data.length === 0) return [];

  const overallAvg = getMetricValue(data, metric);
  const results: VariablePerformance[] = [];

  for (const variable of variableNames) {
    // Group by value
    const groups = new Map<string, CreativeData[]>();

    for (const d of data) {
      const raw = d.extractedVariables[variable];
      if (raw === undefined || raw === null) continue;

      const value = String(raw);
      if (!groups.has(value)) groups.set(value, []);
      groups.get(value)!.push(d);
    }

    // Compute metric per group
    for (const [value, group] of groups) {
      const count = group.length;
      const avgMetric = getMetricValue(group, metric);
      const delta =
        overallAvg !== 0
          ? ((avgMetric - overallAvg) / overallAvg) * 100
          : 0;

      // Confidence based on sample size
      let confidence: VariablePerformance["confidence"];
      if (count < 3) {
        confidence = "insufficient";
      } else if (count < 5) {
        confidence = "low";
      } else if (count < 10) {
        confidence = "medium";
      } else {
        confidence = "high";
      }

      // Bootstrap 95% CI on the delta. Skip for insufficient samples —
      // resampling 1 or 2 points just returns the same point estimate.
      let delta95Lower = delta;
      let delta95Upper = delta;
      if (confidence !== "insufficient") {
        const ci = bootstrapDeltaCI(group, data, metric, 1000, seed);
        delta95Lower = ci.lower95;
        delta95Upper = ci.upper95;
      }

      results.push({
        variable,
        value,
        count,
        avgMetric,
        overallAvg,
        delta,
        delta95Lower,
        delta95Upper,
        confidence,
      });
    }
  }

  // Sort by absolute delta descending (biggest impact first)
  results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return results;
}

/**
 * Compute a dataset trust score (0-100).
 *
 * Five sub-scores feed the composite. Three of them (creative count, mapping
 * quality, data completeness) act as floor conditions — the lowest of the
 * three caps the overall. The remaining two (volume, bucket balance)
 * contribute proportionally on top.
 *
 * Previously there was a sixth sub-score (extraction confidence) computed
 * from extraction_results.confidence. That column is never populated by
 * the Anthropic tool_use API and has been dropped from the schema; the
 * sub-score went with it. See POST_AUDIT_COMPLETION.md (appendix) for the
 * rationale.
 */
export function computeTrustScore(
  creativesAnalysed: number,
  totalImpressions: number,
  mappingPct: number,
  dataCompletenessPct: number,
  variablePerformance: VariablePerformance[]
): TrustScore {
  // Sub-scores (each 0-100)

  // 1. Creative count: scales linearly to 100 at TRUST_CREATIVE_COUNT_TARGET
  const creativeCount = Math.min(
    100,
    (creativesAnalysed / TRUST_CREATIVE_COUNT_TARGET) * 100
  );

  // 2. Volume: log10 of impressions, scaled so 10^6 = 1M impressions = 100
  const volumeScore =
    totalImpressions > 0
      ? Math.min(
          100,
          (Math.log10(totalImpressions) / TRUST_VOLUME_LOG_DENOMINATOR) * 100
        )
      : 0;

  // 3. Mapping quality (already 0-100)
  const mappingQuality = mappingPct;

  // 4. Data completeness (already 0-100)
  const dataCompleteness = dataCompletenessPct;

  // 5. Bucket balance: penalise if too many variable groups have < 3 samples
  const totalBuckets = variablePerformance.length;
  const insufficientBuckets = variablePerformance.filter(
    (v) => v.confidence === "insufficient"
  ).length;
  const bucketBalance =
    totalBuckets > 0
      ? ((totalBuckets - insufficientBuckets) / totalBuckets) * 100
      : 50;

  // Floor-gated composite.
  const floorScore = Math.min(creativeCount, mappingQuality, dataCompleteness);
  const upperScore =
    volumeScore * TRUST_COMPOSITE_VOLUME_WEIGHT +
    bucketBalance * TRUST_COMPOSITE_BUCKET_BALANCE_WEIGHT;
  const overall = Math.round(floorScore * (upperScore / 100));

  const level: TrustScore["level"] =
    overall >= TRUST_THRESHOLD_EXCELLENT
      ? "excellent"
      : overall >= TRUST_THRESHOLD_GOOD
        ? "good"
        : overall >= TRUST_THRESHOLD_FAIR
          ? "fair"
          : "poor";

  return {
    overall,
    creativeCount: Math.round(creativeCount),
    volumeScore: Math.round(volumeScore),
    mappingQuality: Math.round(mappingQuality),
    dataCompleteness: Math.round(dataCompleteness),
    bucketBalance: Math.round(bucketBalance),
    level,
  };
}

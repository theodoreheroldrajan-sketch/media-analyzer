/**
 * Demo data generator — creates a complete fake dataset
 * for a fictional DTC skincare brand "GlowLab" running Meta Ads.
 *
 * Supports two modes:
 * - lite: 40 creatives, simple dashboard
 * - pro:  120 creatives + mocked regression stats + interaction matrices + AI suggestions
 *
 * Deterministic via seeded PRNG so charts look identical on every refresh.
 */

import {
  computeKeyMetrics,
  computeVariablePerformance,
  computeTrustScore,
  type CreativeData,
  type KeyMetrics,
  type VariablePerformance,
  type TrustScore,
  type MetricKey,
} from "./analytics";

// ─── Mode ──────────────────────────────────────────────────────────

export type DemoMode = "lite" | "pro";

// ─── Seeded PRNG (xorshift32) ─────────────────────────────────────
function createRng(seed: number) {
  let s = seed | 0;
  return {
    next(): number {
      s ^= s << 13;
      s ^= s >> 17;
      s ^= s << 5;
      return ((s >>> 0) / 4294967296);
    },
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
    float(min: number, max: number): number {
      return this.next() * (max - min) + min;
    },
    chance(p: number): boolean {
      return this.next() < p;
    },
  };
}

// ─── Types ─────────────────────────────────────────────────────────

export type DemoCreative = {
  id: string;
  filename: string;
  hue: number;
};

export type DemoPerformanceRow = {
  id: string;
  creativeId: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
};

export type DemoInsight = {
  title: string;
  body: string;
  type: "positive" | "negative" | "neutral";
  variable: string;
  delta: string;
  /** Hypothesis = pre-registered; exploratory = pattern detected without prior hypothesis */
  category: "hypothesis" | "exploratory";
};

export type DemoDashboardPayload = {
  hasData: true;
  keyMetrics: KeyMetrics;
  variablePerformance: VariablePerformance[];
  trustScore: TrustScore;
  gallery: {
    creativeId: string;
    filename: string;
    metricValue: number;
    impressions: number;
    clicks: number;
    spend: number;
  }[];
  creativeCount: number;
  regressionReady: boolean;
  regressionThreshold: number;
};

export type DemoProject = {
  id: string;
  name: string;
  brand_name: string;
  brand_category: string;
  platform: string;
  primary_kpi: string;
  campaign_goal: string;
  target_audience: string;
};

// ─── Pro-only extras ──────────────────────────────────────────────

export type RegressionCoefficient = {
  variable: string;
  value: string;            // e.g. "true" for boolean, "warm" for enum value
  coefficient: number;      // β
  stdError: number;
  tStat: number;
  pValue: number;
  ci95Lower: number;
  ci95Upper: number;
  standardizedCoef: number;
  significant: boolean;
};

export type RegressionModel = {
  metric: MetricKey;
  modelR2: number;
  adjustedR2: number;
  modelPValue: number;
  vifMax: number;
  nObservations: number;
  coefficients: RegressionCoefficient[];
};

export type InteractionCell = {
  var1Value: string;
  var2Value: string;
  count: number;
  metricValue: number;
};

export type VariableInteraction = {
  var1: string;
  var2: string;
  cells: InteractionCell[];
};

export type AISuggestion = {
  name: string;
  type: "boolean" | "enum" | "integer" | "string";
  enumValues?: string[];
  rationale: string;
  estimatedImpact: string;
};

export type MatchSplit = {
  autoMatched: string[];       // creativeIds
  suggested: {
    creativeId: string;
    suggestedPerfRowId: string;
    confidence: number;
    method: "exact" | "normalised" | "ad_name" | "fuzzy" | "manual";
  }[];
  unmatched: string[];         // creativeIds with no candidate
};

export type DemoDataSet = {
  mode: DemoMode;
  project: DemoProject;
  creatives: DemoCreative[];
  performanceRows: DemoPerformanceRow[];
  creativeData: CreativeData[];
  variableNames: string[];
  insights: DemoInsight[];
  dashboards: Record<MetricKey, DemoDashboardPayload>;
  // Pro-only:
  regressionModels?: Record<MetricKey, RegressionModel>;
  variableInteractions?: VariableInteraction[];
  aiSuggestedVariables?: AISuggestion[];
  matchSplit?: MatchSplit;
};

// ─── Variable definitions for demo ────────────────────────────────

const DEMO_VARIABLES: {
  name: string;
  type: "boolean" | "enum" | "integer";
  values?: string[];
}[] = [
  { name: "human_present", type: "boolean" },
  { name: "face_visible", type: "boolean" },
  { name: "product_visible", type: "boolean" },
  { name: "text_overlay", type: "boolean" },
  { name: "logo_visible", type: "boolean" },
  { name: "cta_present", type: "boolean" },
  { name: "offer_present", type: "boolean" },
  { name: "urgency_cue", type: "boolean" },
  { name: "social_proof", type: "boolean" },
  { name: "headline_present", type: "boolean" },
  { name: "price_shown", type: "boolean" },
  { name: "brand_colours_used", type: "boolean" },
  { name: "colour_palette", type: "enum", values: ["warm", "cool", "neutral", "vibrant", "muted", "dark", "light"] },
  { name: "contrast", type: "enum", values: ["high", "medium", "low"] },
  { name: "message_angle", type: "enum", values: ["benefit", "feature", "problem_solution", "testimonial", "lifestyle", "emotional"] },
  { name: "creative_format", type: "enum", values: ["static_image", "carousel_card", "story_frame", "square_post"] },
  { name: "text_density", type: "enum", values: ["none", "minimal", "moderate", "heavy"] },
  { name: "visual_clutter", type: "enum", values: ["minimal", "moderate", "cluttered"] },
  { name: "funnel_stage", type: "enum", values: ["awareness", "consideration", "conversion", "retention"] },
  { name: "lifestyle_vs_studio", type: "enum", values: ["lifestyle", "studio", "flat_lay", "on_model", "mixed"] },
  { name: "number_of_people", type: "integer" },
  { name: "product_count", type: "enum", values: ["single", "multiple", "collection"] },
];

// ─── Correlation rules ────────────────────────────────────────────

type CorrelationRule = {
  variable: string;
  value: string | boolean;
  ctrMult: number;
  cpcMult: number;
  cpaMult: number;
  cvrMult: number;
  roasMult: number;
};

const CORRELATIONS: CorrelationRule[] = [
  { variable: "human_present", value: true, ctrMult: 1.18, cpcMult: 0.88, cpaMult: 0.92, cvrMult: 1.12, roasMult: 1.15 },
  { variable: "face_visible", value: true, ctrMult: 1.12, cpcMult: 0.92, cpaMult: 0.95, cvrMult: 1.08, roasMult: 1.10 },
  { variable: "cta_present", value: true, ctrMult: 1.08, cpcMult: 0.95, cpaMult: 0.85, cvrMult: 1.15, roasMult: 1.12 },
  { variable: "urgency_cue", value: true, ctrMult: 1.15, cpcMult: 0.90, cpaMult: 0.80, cvrMult: 1.20, roasMult: 1.18 },
  { variable: "social_proof", value: true, ctrMult: 1.06, cpcMult: 0.94, cpaMult: 0.88, cvrMult: 1.14, roasMult: 1.16 },
  { variable: "colour_palette", value: "warm", ctrMult: 1.10, cpcMult: 0.93, cpaMult: 0.91, cvrMult: 1.09, roasMult: 1.11 },
  { variable: "colour_palette", value: "cool", ctrMult: 0.92, cpcMult: 1.06, cpaMult: 1.08, cvrMult: 0.94, roasMult: 0.93 },
  { variable: "lifestyle_vs_studio", value: "lifestyle", ctrMult: 1.14, cpcMult: 0.89, cpaMult: 0.87, cvrMult: 1.11, roasMult: 1.13 },
  { variable: "lifestyle_vs_studio", value: "studio", ctrMult: 0.94, cpcMult: 1.04, cpaMult: 1.06, cvrMult: 0.96, roasMult: 0.95 },
  { variable: "message_angle", value: "benefit", ctrMult: 1.11, cpcMult: 0.91, cpaMult: 0.86, cvrMult: 1.13, roasMult: 1.14 },
  { variable: "message_angle", value: "emotional", ctrMult: 1.09, cpcMult: 0.93, cpaMult: 0.90, cvrMult: 1.10, roasMult: 1.08 },
  { variable: "visual_clutter", value: "cluttered", ctrMult: 0.85, cpcMult: 1.12, cpaMult: 1.15, cvrMult: 0.88, roasMult: 0.84 },
  { variable: "offer_present", value: true, ctrMult: 1.12, cpcMult: 0.88, cpaMult: 0.82, cvrMult: 1.18, roasMult: 1.22 },
  { variable: "text_density", value: "heavy", ctrMult: 0.88, cpcMult: 1.10, cpaMult: 1.08, cvrMult: 0.93, roasMult: 0.90 },
  { variable: "text_density", value: "minimal", ctrMult: 1.07, cpcMult: 0.94, cpaMult: 0.96, cvrMult: 1.04, roasMult: 1.05 },
];

// ─── Helpers ──────────────────────────────────────────────────────

const SEED_LITE = 20240613;
const SEED_PRO = 20250307;

function generateVariableValues(rng: ReturnType<typeof createRng>): Record<string, unknown> {
  const vars: Record<string, unknown> = {};
  for (const v of DEMO_VARIABLES) {
    switch (v.type) {
      case "boolean":
        vars[v.name] = rng.chance(
          v.name === "product_visible" ? 0.85 :
          v.name === "human_present" ? 0.55 :
          v.name === "face_visible" ? 0.45 :
          v.name === "text_overlay" ? 0.75 :
          v.name === "logo_visible" ? 0.70 :
          v.name === "cta_present" ? 0.65 :
          v.name === "offer_present" ? 0.40 :
          v.name === "urgency_cue" ? 0.30 :
          v.name === "social_proof" ? 0.35 :
          v.name === "headline_present" ? 0.80 :
          v.name === "price_shown" ? 0.45 :
          v.name === "brand_colours_used" ? 0.60 :
          0.50
        );
        break;
      case "enum":
        vars[v.name] = rng.pick(v.values!);
        break;
      case "integer":
        if (v.name === "number_of_people") {
          vars[v.name] = rng.chance(0.45) ? 0 : rng.int(1, 3);
        } else {
          vars[v.name] = rng.int(0, 5);
        }
        break;
    }
  }
  return vars;
}

function computePerformance(
  vars: Record<string, unknown>,
  rng: ReturnType<typeof createRng>
): { impressions: number; clicks: number; spend: number; conversions: number; revenue: number } {
  let baseCTR = 2.1;
  let baseCPC = 1.45;
  let baseCVR = 3.8;
  let baseROAS = 3.2;

  for (const rule of CORRELATIONS) {
    const val = vars[rule.variable];
    const matches =
      typeof rule.value === "boolean"
        ? val === rule.value
        : String(val) === String(rule.value);
    if (matches) {
      baseCTR *= rule.ctrMult;
      baseCPC *= rule.cpcMult;
      baseCVR *= rule.cvrMult;
      baseROAS *= rule.roasMult;
    }
  }

  baseCTR *= rng.float(0.85, 1.15);
  baseCPC *= rng.float(0.85, 1.15);
  baseCVR *= rng.float(0.85, 1.15);
  baseROAS *= rng.float(0.85, 1.15);

  const impressions = rng.int(8000, 120000);
  const clicks = Math.round(impressions * (baseCTR / 100));
  const spend = Math.round(clicks * baseCPC * 100) / 100;
  const conversions = Math.max(1, Math.round(clicks * (baseCVR / 100)));
  const revenue = Math.round(spend * baseROAS * 100) / 100;

  return { impressions, clicks, spend, conversions, revenue };
}

function buildGallery(
  creativeData: CreativeData[],
  metric: MetricKey
): DemoDashboardPayload["gallery"] {
  const withMetric = creativeData.map((c) => {
    let metricValue: number;
    switch (metric) {
      case "ctr": metricValue = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0; break;
      case "cpc": metricValue = c.clicks > 0 ? c.spend / c.clicks : 0; break;
      case "cpa": metricValue = c.conversions > 0 ? c.spend / c.conversions : 0; break;
      case "cvr": metricValue = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0; break;
      case "roas": metricValue = c.spend > 0 ? c.revenue / c.spend : 0; break;
    }
    return {
      creativeId: c.creativeId,
      filename: c.filename,
      metricValue,
      impressions: c.impressions,
      clicks: c.clicks,
      spend: c.spend,
    };
  });

  if (metric === "cpc" || metric === "cpa") {
    withMetric.sort((a, b) => a.metricValue - b.metricValue);
  } else {
    withMetric.sort((a, b) => b.metricValue - a.metricValue);
  }
  return withMetric;
}

// ─── Mocked regression stats (Pro-only) ───────────────────────────

function buildRegressionModel(
  metric: MetricKey,
  varPerf: VariablePerformance[],
  nObservations: number,
  rng: ReturnType<typeof createRng>
): RegressionModel {
  // Lower-is-better metrics need sign flipped for "good" interpretation
  const lowerIsBetter = metric === "cpc" || metric === "cpa";

  const coefficients: RegressionCoefficient[] = [];

  // Derive coefficients from the existing delta data so they're internally consistent
  for (const vp of varPerf.slice(0, 30)) {
    if (vp.confidence === "insufficient") continue;

    // Scale delta% into a realistic β (-0.5 to +0.5 range)
    const rawBeta = (vp.delta / 100) * (lowerIsBetter ? -1 : 1) * 0.5;
    const noise = rng.float(-0.05, 0.05);
    const coefficient = parseFloat((rawBeta + noise).toFixed(4));

    // Std error inversely proportional to count
    const stdError = parseFloat(
      (Math.abs(coefficient) * rng.float(0.15, 0.45) + 0.02).toFixed(4)
    );
    const tStat = parseFloat((coefficient / stdError).toFixed(2));

    // p-value: roughly Math.exp(-|t|) clamped
    const pValue = parseFloat(
      Math.min(0.99, Math.max(0.0001, Math.exp(-Math.abs(tStat) * 0.7) * rng.float(0.5, 1.5))).toFixed(4)
    );

    const ci95Half = stdError * 1.96;
    const ci95Lower = parseFloat((coefficient - ci95Half).toFixed(4));
    const ci95Upper = parseFloat((coefficient + ci95Half).toFixed(4));

    // Standardized coefficient (mocked)
    const standardizedCoef = parseFloat((coefficient * rng.float(0.8, 1.2)).toFixed(3));

    coefficients.push({
      variable: vp.variable,
      value: vp.value,
      coefficient,
      stdError,
      tStat,
      pValue,
      ci95Lower,
      ci95Upper,
      standardizedCoef,
      significant: pValue < 0.05,
    });
  }

  // Sort by |t-stat| descending (most significant first)
  coefficients.sort((a, b) => Math.abs(b.tStat) - Math.abs(a.tStat));

  return {
    metric,
    modelR2: parseFloat(rng.float(0.42, 0.58).toFixed(3)),
    adjustedR2: parseFloat(rng.float(0.38, 0.54).toFixed(3)),
    modelPValue: parseFloat(rng.float(0.0001, 0.001).toFixed(4)),
    vifMax: parseFloat(rng.float(1.8, 3.5).toFixed(2)),
    nObservations,
    coefficients,
  };
}

// ─── Mocked interaction matrices (Pro-only) ───────────────────────

function buildInteractionMatrices(
  creativeData: CreativeData[],
  metric: MetricKey
): VariableInteraction[] {
  const pairs: [string, string][] = [
    ["human_present", "colour_palette"],
    ["urgency_cue", "message_angle"],
    ["offer_present", "lifestyle_vs_studio"],
    ["face_visible", "text_density"],
    ["social_proof", "funnel_stage"],
  ];

  return pairs.map(([var1, var2]) => {
    const cells = new Map<string, { impressions: number; clicks: number; spend: number; conversions: number; revenue: number; count: number }>();

    for (const c of creativeData) {
      const v1 = String(c.extractedVariables[var1]);
      const v2 = String(c.extractedVariables[var2]);
      const key = `${v1}|${v2}`;
      if (!cells.has(key)) {
        cells.set(key, { impressions: 0, clicks: 0, spend: 0, conversions: 0, revenue: 0, count: 0 });
      }
      const entry = cells.get(key)!;
      entry.impressions += c.impressions;
      entry.clicks += c.clicks;
      entry.spend += c.spend;
      entry.conversions += c.conversions;
      entry.revenue += c.revenue;
      entry.count += 1;
    }

    const cellArr: InteractionCell[] = [];
    for (const [key, agg] of cells) {
      const [var1Value, var2Value] = key.split("|");
      let metricValue: number;
      switch (metric) {
        case "ctr": metricValue = agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0; break;
        case "cpc": metricValue = agg.clicks > 0 ? agg.spend / agg.clicks : 0; break;
        case "cpa": metricValue = agg.conversions > 0 ? agg.spend / agg.conversions : 0; break;
        case "cvr": metricValue = agg.clicks > 0 ? (agg.conversions / agg.clicks) * 100 : 0; break;
        case "roas": metricValue = agg.spend > 0 ? agg.revenue / agg.spend : 0; break;
      }
      cellArr.push({
        var1Value,
        var2Value,
        count: agg.count,
        metricValue,
      });
    }

    return { var1, var2, cells: cellArr };
  });
}

// ─── AI variable suggestions (Pro-only) ───────────────────────────

const AI_SUGGESTIONS: AISuggestion[] = [
  {
    name: "skin_type_mentioned",
    type: "boolean",
    rationale: "Several creatives include callouts like 'oily', 'sensitive', or 'combination' skin. Testing whether skin-type targeting in copy moves CVR could isolate a strong segment.",
    estimatedImpact: "high",
  },
  {
    name: "before_after_visible",
    type: "boolean",
    rationale: "~12% of your creatives feature side-by-side comparison shots. Before/after is a known high-performing format for skincare — worth isolating to validate.",
    estimatedImpact: "high",
  },
  {
    name: "ingredient_callout",
    type: "enum",
    enumValues: ["niacinamide", "vitamin_c", "retinol", "hyaluronic", "none", "other"],
    rationale: "Hero ingredient callouts appear in roughly 30% of creatives. Categorising by named ingredient could surface which trends drive purchase intent.",
    estimatedImpact: "medium",
  },
  {
    name: "seasonal_motif",
    type: "enum",
    enumValues: ["summer", "winter", "spring", "festive", "none"],
    rationale: "Summer-themed visuals (sun, beach) dominate Q2 ads. Testing whether seasonal framing affects performance vs evergreen would inform calendar planning.",
    estimatedImpact: "medium",
  },
];

// ─── Mocked mapping split (Pro-only) ──────────────────────────────

function buildMatchSplit(creatives: DemoCreative[], rng: ReturnType<typeof createRng>): MatchSplit {
  // For Pro: 110 auto + 7 suggested + 3 unmatched out of 120
  const total = creatives.length;
  const unmatchedCount = Math.min(3, Math.max(0, Math.floor(total * 0.025)));
  const suggestedCount = Math.min(7, Math.max(0, Math.floor(total * 0.06)));
  const autoCount = total - suggestedCount - unmatchedCount;

  const shuffled = [...creatives].sort(() => rng.float(-1, 1));

  const autoMatched = shuffled.slice(0, autoCount).map((c) => c.id);
  const methods: ("normalised" | "ad_name" | "fuzzy")[] = ["normalised", "ad_name", "fuzzy"];

  const suggested = shuffled.slice(autoCount, autoCount + suggestedCount).map((c) => ({
    creativeId: c.id,
    suggestedPerfRowId: `demo-perf-${c.id.slice(-3)}`,
    confidence: parseFloat(rng.float(0.55, 0.85).toFixed(2)),
    method: rng.pick(methods),
  }));

  const unmatched = shuffled.slice(autoCount + suggestedCount).map((c) => c.id);

  return { autoMatched, suggested, unmatched };
}

// ─── Generator ────────────────────────────────────────────────────

const _cached: Partial<Record<DemoMode, DemoDataSet>> = {};

export function generateDemoData(mode: DemoMode = "lite"): DemoDataSet {
  if (_cached[mode]) return _cached[mode]!;

  const seed = mode === "pro" ? SEED_PRO : SEED_LITE;
  const creativeCount = mode === "pro" ? 120 : 40;
  const rng = createRng(seed);

  const project: DemoProject = {
    id: `demo-project-${mode}`,
    name: mode === "pro"
      ? "GlowLab Annual Performance Audit"
      : "GlowLab Summer Campaign",
    brand_name: "GlowLab",
    brand_category: "E-commerce / DTC Beauty",
    platform: "Meta Ads",
    primary_kpi: "roas",
    campaign_goal: mode === "pro"
      ? "Cross-campaign performance analysis to identify creative patterns driving ROAS at scale"
      : "Drive online purchases for summer skincare line",
    target_audience: "Women 25-45, skincare enthusiasts",
  };

  const creatives: DemoCreative[] = [];
  const performanceRows: DemoPerformanceRow[] = [];
  const creativeData: CreativeData[] = [];

  const campaigns = mode === "pro"
    ? ["Summer24", "Winter24", "Holiday23", "SPF_Launch", "Bundle_Promo", "Retinol_Drop"]
    : ["Summer24", "Glow_Drop", "SPF_Launch", "Bundle_Promo"];

  const perCampaign = Math.ceil(creativeCount / campaigns.length);

  for (let i = 0; i < creativeCount; i++) {
    const campaign = campaigns[Math.min(campaigns.length - 1, Math.floor(i / perCampaign))];
    const num = String(i + 1).padStart(3, "0");
    const id = `demo-creative-${mode}-${num}`;
    const perfId = `demo-perf-${mode}-${num}`;
    const filename = `GL_Meta_${campaign}_${num}.jpg`;
    const hue = (i * 9 + 15) % 360;

    const extractedVariables = generateVariableValues(rng);
    const perf = computePerformance(extractedVariables, rng);

    creatives.push({ id, filename, hue });
    performanceRows.push({ id: perfId, creativeId: id, ...perf });
    creativeData.push({
      creativeId: id,
      filename,
      extractedVariables,
      ...perf,
    });
  }

  const variableNames = DEMO_VARIABLES.map((v) => v.name);
  const metrics: MetricKey[] = ["ctr", "cpc", "cpa", "cvr", "roas"];
  const dashboards = {} as Record<MetricKey, DemoDashboardPayload>;

  const keyMetrics = computeKeyMetrics(creativeData);

  for (const m of metrics) {
    const varPerf = computeVariablePerformance(creativeData, variableNames, m);
    const trustScore = computeTrustScore(
      creativeData.length,
      keyMetrics.totalImpressions,
      100,
      100,
      0.92,
      varPerf
    );

    dashboards[m] = {
      hasData: true,
      keyMetrics,
      variablePerformance: varPerf,
      trustScore,
      gallery: buildGallery(creativeData, m),
      creativeCount,
      regressionReady: mode === "pro",
      regressionThreshold: 100,
    };
  }

  // Insights (different tone per mode)
  const insights: DemoInsight[] = mode === "pro" ? [
    {
      title: "Human faces show strongest CTR coefficient",
      body: "Regression on 120 creatives places face_visible at the top of the standardised coefficient ranking for CTR (β = +0.34, p < 0.001), after controlling for all other variables. The pattern is consistent across campaign periods.",
      type: "positive",
      variable: "face_visible",
      delta: "β=+0.34, p<0.001",
      category: "hypothesis",
    },
    {
      title: "Urgency × offer interaction",
      body: "Creatives combining urgency_cue=true AND offer_present=true show a positive interaction term (p = 0.018) beyond what either variable contributes alone. Worth testing deliberate pairings in future creatives.",
      type: "positive",
      variable: "urgency_cue × offer_present",
      delta: "interaction p=0.018",
      category: "hypothesis",
    },
    {
      title: "Visual clutter is the strongest negative predictor",
      body: "cluttered=true shows β = -0.41 on ROAS (p < 0.001), the largest negative effect in this model. The pattern persists after controlling for text_density and subject matter.",
      type: "negative",
      variable: "visual_clutter",
      delta: "β=-0.41 on ROAS",
      category: "exploratory",
    },
    {
      title: "Warm palette directional signal, conservative effect",
      body: "Warm vs cool palette shows +11% CTR in raw group-by analysis, but the regression coefficient (β = +0.18, p = 0.04) is more conservative. The real effect likely sits between 5-15% on this sample.",
      type: "positive",
      variable: "colour_palette",
      delta: "β=+0.18, p=0.04",
      category: "exploratory",
    },
    {
      title: "Lifestyle context out-correlates studio shots",
      body: "lifestyle_vs_studio=lifestyle shows β = +0.27 on CTR (p = 0.003). The effect is larger in the consideration-stage funnel (β = +0.41) than conversion-stage (β = +0.12) on this dataset.",
      type: "positive",
      variable: "lifestyle_vs_studio",
      delta: "β=+0.27, p=0.003",
      category: "exploratory",
    },
    {
      title: "Model fit is acceptable, room to improve",
      body: "R² = 0.52 means the model explains roughly 52% of CTR variance. Adjusted R² of 0.48 suggests no severe overfitting. Adding interaction terms and the AI-suggested variables (skin_type_mentioned, before_after_visible) could push R² higher.",
      type: "neutral",
      variable: "model_fit",
      delta: "R²=0.52",
      category: "exploratory",
    },
    {
      title: "Text density: less is more (directional)",
      body: "text_density=heavy shows β = -0.22 (p = 0.008) on CTR while text_density=minimal shows β = +0.14 (p = 0.03). The relationship is monotonic on this dataset; every step toward less text correlates with better engagement.",
      type: "negative",
      variable: "text_density",
      delta: "heavy: β=-0.22",
      category: "exploratory",
    },
    {
      title: "VIF is healthy",
      body: "Maximum Variance Inflation Factor across predictors is 2.8, well below the typical concern threshold of 5. Multi-collinearity is not a problem in this model; coefficient estimates are reliable.",
      type: "neutral",
      variable: "model_diagnostics",
      delta: "VIF_max=2.8",
      category: "exploratory",
    },
  ] : [
    {
      title: "Human faces correlate with engagement",
      body: "Creatives with visible human faces show consistently higher click-through rates on this dataset. The pattern holds across campaign themes and is most pronounced in awareness-stage ads. Treat as a directional signal worth confirming on more data.",
      type: "positive",
      variable: "face_visible",
      delta: "+12-18% CTR",
      category: "hypothesis",
    },
    {
      title: "Urgency cues align with lower CPA",
      body: "Creatives featuring urgency language ('limited time', 'selling fast') show meaningfully lower cost-per-acquisition. Worth a deliberate test by adding time-bound offers to a tranche of new creatives.",
      type: "positive",
      variable: "urgency_cue",
      delta: "-20% CPA",
      category: "hypothesis",
    },
    {
      title: "Cluttered creatives underperform across metrics",
      body: "Pattern observed: cluttered compositions trail across every metric on this sample. The strongest performers have minimal or moderate visual complexity with a clear focal point. Hypothesis-generating only — confirm with a structured test.",
      type: "negative",
      variable: "visual_clutter",
      delta: "-15% CTR when cluttered",
      category: "exploratory",
    },
    {
      title: "Warm palettes lead cool palettes",
      body: "Directional signal: warm-toned creatives (golds, peach, soft pinks) outperform cool-toned ones (blues, silvers) on this skincare brand's data. Aligns with brand colour identity, but worth confirming on a larger sample before generalising.",
      type: "positive",
      variable: "colour_palette",
      delta: "+10% CTR for warm vs cool",
      category: "exploratory",
    },
    {
      title: "Lifestyle context out-clicks studio shots",
      body: "Pattern observed: products shown in real-life contexts (bathroom shelves, morning routines) out-click plain studio shots on this sample, especially in consideration and conversion stages. Use as a starting point for a structured comparison.",
      type: "neutral",
      variable: "lifestyle_vs_studio",
      delta: "+14% CTR for lifestyle",
      category: "exploratory",
    },
  ];

  const dataset: DemoDataSet = {
    mode,
    project,
    creatives,
    performanceRows,
    creativeData,
    variableNames,
    insights,
    dashboards,
  };

  // Pro-only extras
  if (mode === "pro") {
    const regressionModels = {} as Record<MetricKey, RegressionModel>;
    for (const m of metrics) {
      regressionModels[m] = buildRegressionModel(
        m,
        dashboards[m].variablePerformance,
        creativeCount,
        rng
      );
    }
    dataset.regressionModels = regressionModels;
    dataset.variableInteractions = buildInteractionMatrices(creativeData, "ctr");
    dataset.aiSuggestedVariables = AI_SUGGESTIONS;
    dataset.matchSplit = buildMatchSplit(creatives, rng);
  }

  _cached[mode] = dataset;
  return dataset;
}

/** Get the list of demo variable definitions (for the variables page) */
export function getDemoVariables() {
  return DEMO_VARIABLES;
}

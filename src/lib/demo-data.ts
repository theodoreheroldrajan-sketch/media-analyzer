/**
 * Demo data generator — creates a complete fake dataset
 * for a fictional DTC skincare brand "GlowLab" running Meta Ads.
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

// ─── Seeded PRNG (xorshift32) ─────────────────────────────────────
function createRng(seed: number) {
  let s = seed | 0;
  return {
    /** Returns a float in [0, 1) */
    next(): number {
      s ^= s << 13;
      s ^= s >> 17;
      s ^= s << 5;
      return ((s >>> 0) / 4294967296);
    },
    /** Returns an int in [min, max] inclusive */
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    /** Pick one element from an array */
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
    /** Returns a float in [min, max) */
    float(min: number, max: number): number {
      return this.next() * (max - min) + min;
    },
    /** Returns true with given probability (0-1) */
    chance(p: number): boolean {
      return this.next() < p;
    },
  };
}

// ─── Types ─────────────────────────────────────────────────────────

export type DemoCreative = {
  id: string;
  filename: string;
  hue: number; // for placeholder thumbnail colour
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

export type DemoDataSet = {
  project: DemoProject;
  creatives: DemoCreative[];
  performanceRows: DemoPerformanceRow[];
  creativeData: CreativeData[];
  variableNames: string[];
  insights: DemoInsight[];
  dashboards: Record<MetricKey, DemoDashboardPayload>;
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
// These make the demo data tell a realistic story.

type CorrelationRule = {
  variable: string;
  value: string | boolean;
  ctrMult: number;     // multiply base CTR
  cpcMult: number;     // multiply base CPC
  cpaMult: number;     // multiply base CPA
  cvrMult: number;     // multiply base CVR
  roasMult: number;    // multiply base ROAS
};

const CORRELATIONS: CorrelationRule[] = [
  // Humans and faces drive engagement
  { variable: "human_present", value: true, ctrMult: 1.18, cpcMult: 0.88, cpaMult: 0.92, cvrMult: 1.12, roasMult: 1.15 },
  { variable: "face_visible", value: true, ctrMult: 1.12, cpcMult: 0.92, cpaMult: 0.95, cvrMult: 1.08, roasMult: 1.10 },
  // CTAs and urgency help conversions
  { variable: "cta_present", value: true, ctrMult: 1.08, cpcMult: 0.95, cpaMult: 0.85, cvrMult: 1.15, roasMult: 1.12 },
  { variable: "urgency_cue", value: true, ctrMult: 1.15, cpcMult: 0.90, cpaMult: 0.80, cvrMult: 1.20, roasMult: 1.18 },
  // Social proof builds trust
  { variable: "social_proof", value: true, ctrMult: 1.06, cpcMult: 0.94, cpaMult: 0.88, cvrMult: 1.14, roasMult: 1.16 },
  // Warm colours beat cool for skincare
  { variable: "colour_palette", value: "warm", ctrMult: 1.10, cpcMult: 0.93, cpaMult: 0.91, cvrMult: 1.09, roasMult: 1.11 },
  { variable: "colour_palette", value: "cool", ctrMult: 0.92, cpcMult: 1.06, cpaMult: 1.08, cvrMult: 0.94, roasMult: 0.93 },
  // Lifestyle outperforms studio for this brand
  { variable: "lifestyle_vs_studio", value: "lifestyle", ctrMult: 1.14, cpcMult: 0.89, cpaMult: 0.87, cvrMult: 1.11, roasMult: 1.13 },
  { variable: "lifestyle_vs_studio", value: "studio", ctrMult: 0.94, cpcMult: 1.04, cpaMult: 1.06, cvrMult: 0.96, roasMult: 0.95 },
  // Benefit messaging wins
  { variable: "message_angle", value: "benefit", ctrMult: 1.11, cpcMult: 0.91, cpaMult: 0.86, cvrMult: 1.13, roasMult: 1.14 },
  { variable: "message_angle", value: "emotional", ctrMult: 1.09, cpcMult: 0.93, cpaMult: 0.90, cvrMult: 1.10, roasMult: 1.08 },
  // Cluttered visuals hurt
  { variable: "visual_clutter", value: "cluttered", ctrMult: 0.85, cpcMult: 1.12, cpaMult: 1.15, cvrMult: 0.88, roasMult: 0.84 },
  // Offers drive ROAS
  { variable: "offer_present", value: true, ctrMult: 1.12, cpcMult: 0.88, cpaMult: 0.82, cvrMult: 1.18, roasMult: 1.22 },
  // Heavy text hurts CTR
  { variable: "text_density", value: "heavy", ctrMult: 0.88, cpcMult: 1.10, cpaMult: 1.08, cvrMult: 0.93, roasMult: 0.90 },
  { variable: "text_density", value: "minimal", ctrMult: 1.07, cpcMult: 0.94, cpaMult: 0.96, cvrMult: 1.04, roasMult: 1.05 },
];

// ─── Generator ────────────────────────────────────────────────────

const SEED = 20240613;
const CREATIVE_COUNT = 40;

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
  // Base metrics for a skincare DTC brand on Meta
  let baseCTR = 2.1;     // 2.1% base click-through rate
  let baseCPC = 1.45;    // $1.45 base cost per click
  let baseCVR = 3.8;     // 3.8% base conversion rate
  let baseROAS = 3.2;    // 3.2x base return on ad spend

  // Apply correlations
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

  // Add noise (±15%)
  baseCTR *= rng.float(0.85, 1.15);
  baseCPC *= rng.float(0.85, 1.15);
  baseCVR *= rng.float(0.85, 1.15);
  baseROAS *= rng.float(0.85, 1.15);

  // Generate raw numbers
  const impressions = rng.int(8000, 120000);
  const clicks = Math.round(impressions * (baseCTR / 100));
  const spend = Math.round(clicks * baseCPC * 100) / 100;
  const conversions = Math.max(1, Math.round(clicks * (baseCVR / 100)));
  const avgOrderValue = rng.float(35, 85);
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
      case "ctr":
        metricValue = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
        break;
      case "cpc":
        metricValue = c.clicks > 0 ? c.spend / c.clicks : 0;
        break;
      case "cpa":
        metricValue = c.conversions > 0 ? c.spend / c.conversions : 0;
        break;
      case "cvr":
        metricValue = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
        break;
      case "roas":
        metricValue = c.spend > 0 ? c.revenue / c.spend : 0;
        break;
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

  // Sort: for CPC/CPA lower is better → ascending; else descending
  if (metric === "cpc" || metric === "cpa") {
    withMetric.sort((a, b) => a.metricValue - b.metricValue);
  } else {
    withMetric.sort((a, b) => b.metricValue - a.metricValue);
  }

  return withMetric;
}

// ─── Main export ──────────────────────────────────────────────────

let _cached: DemoDataSet | null = null;

export function generateDemoData(): DemoDataSet {
  if (_cached) return _cached;

  const rng = createRng(SEED);

  // Project
  const project: DemoProject = {
    id: "demo-project-001",
    name: "GlowLab Summer Campaign",
    brand_name: "GlowLab",
    brand_category: "E-commerce / DTC Beauty",
    platform: "Meta Ads",
    primary_kpi: "roas",
    campaign_goal: "Drive online purchases for summer skincare line",
    target_audience: "Women 25-45, skincare enthusiasts",
  };

  // Generate creatives + performance
  const creatives: DemoCreative[] = [];
  const performanceRows: DemoPerformanceRow[] = [];
  const creativeData: CreativeData[] = [];

  const campaigns = ["Summer24", "Glow_Drop", "SPF_Launch", "Bundle_Promo"];

  for (let i = 0; i < CREATIVE_COUNT; i++) {
    const campaign = campaigns[Math.floor(i / 10)];
    const num = String(i + 1).padStart(3, "0");
    const id = `demo-creative-${num}`;
    const perfId = `demo-perf-${num}`;
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

  // Variable names (exclude string types — only analyzable ones)
  const variableNames = DEMO_VARIABLES.map((v) => v.name);

  // Pre-compute dashboards for all 5 metrics
  const metrics: MetricKey[] = ["ctr", "cpc", "cpa", "cvr", "roas"];
  const dashboards = {} as Record<MetricKey, DemoDashboardPayload>;

  const keyMetrics = computeKeyMetrics(creativeData);

  for (const m of metrics) {
    const varPerf = computeVariablePerformance(creativeData, variableNames, m);

    const trustScore = computeTrustScore(
      creativeData.length,
      keyMetrics.totalImpressions,
      100, // mapping quality — all matched in demo
      100, // data completeness — all rows have data
      0.92, // avg extraction confidence
      varPerf
    );

    dashboards[m] = {
      hasData: true,
      keyMetrics,
      variablePerformance: varPerf,
      trustScore,
      gallery: buildGallery(creativeData, m),
      creativeCount: CREATIVE_COUNT,
      regressionReady: false,
      regressionThreshold: 100,
    };
  }

  // Insights
  const insights: DemoInsight[] = [
    {
      title: "Human faces drive engagement",
      body: "Creatives with visible human faces have consistently higher click-through rates. This pattern holds across all campaign themes and is strongest in the awareness funnel stage.",
      type: "positive",
      variable: "face_visible",
      delta: "+12-18% CTR",
    },
    {
      title: "Urgency cues boost conversions",
      body: "Creatives featuring urgency language ('limited time', 'selling fast') show significantly lower cost-per-acquisition. Consider adding time-bound offers to more creatives.",
      type: "positive",
      variable: "urgency_cue",
      delta: "-20% CPA",
    },
    {
      title: "Visual clutter hurts performance",
      body: "Cluttered creatives underperform across every metric. Simplify compositions — the best performers have minimal or moderate visual complexity with a clear focal point.",
      type: "negative",
      variable: "visual_clutter",
      delta: "-15% CTR when cluttered",
    },
    {
      title: "Warm colour palettes outperform cool",
      body: "For this skincare brand, warm-toned creatives (golds, peach, soft pinks) outperform cool-toned ones (blues, silvers). This aligns with the brand identity and product packaging.",
      type: "positive",
      variable: "colour_palette",
      delta: "+10% CTR for warm vs cool",
    },
    {
      title: "Lifestyle imagery beats studio shots",
      body: "Products shown in real-life contexts (bathroom shelves, morning routines) perform better than plain studio product shots, especially for consideration and conversion-stage ads.",
      type: "neutral",
      variable: "lifestyle_vs_studio",
      delta: "+14% CTR for lifestyle",
    },
  ];

  _cached = {
    project,
    creatives,
    performanceRows,
    creativeData,
    variableNames,
    insights,
    dashboards,
  };

  return _cached;
}

/** Get the list of demo variable definitions (for the variables page) */
export function getDemoVariables() {
  return DEMO_VARIABLES;
}

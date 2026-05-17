/**
 * Static lookup tables for the Simplified dashboard view.
 *
 * Keeps editorial copy out of the demo data generator so it can be reviewed,
 * edited, and translated independently of the deterministic PRNG output.
 * All lookups gracefully fall back when a key is missing.
 */

import type { MetricKey } from "./analytics";

export type VariableCopy = {
  /** Title-cased human-readable name, e.g. "Human Face Visible" */
  plainName: string;
  /** Short noun phrase used in finding-card headlines, e.g. "ads showing a real person" */
  phrase: string;
  /** Sentence shown under a finding card explaining what to do about it */
  tipPositive: string;
  tipNegative: string;
};

const VARIABLE_COPY: Record<string, VariableCopy> = {
  human_present: {
    plainName: "A person in the ad",
    phrase: "ads showing a real person",
    tipPositive: "Keep including people in your creatives — this is your most reliable signal.",
    tipNegative: "Test more product-only shots to confirm whether people are hurting performance.",
  },
  face_visible: {
    plainName: "A visible face",
    phrase: "ads where a face is visible",
    tipPositive: "Push visible-face creatives — they're driving the strongest engagement.",
    tipNegative: "Faces aren't helping here — test alternative compositions.",
  },
  product_visible: {
    plainName: "Product clearly shown",
    phrase: "ads with the product clearly shown",
    tipPositive: "Keep the product front and centre in your hero shots.",
    tipNegative: "Lifestyle framing may be working better — test product-less hero shots.",
  },
  text_overlay: {
    plainName: "Text overlay on the image",
    phrase: "ads with text overlay",
    tipPositive: "Overlay text is working — keep using it.",
    tipNegative: "Try cleaner visuals without overlay text.",
  },
  logo_visible: {
    plainName: "Logo visible",
    phrase: "ads with a visible logo",
    tipPositive: "Brand recall is helping conversion. Keep logos visible.",
    tipNegative: "Logos may be cluttering the frame — test logo-free variants.",
  },
  cta_present: {
    plainName: "Call-to-action button",
    phrase: "ads with a clear call-to-action",
    tipPositive: "Always include a clear CTA — it's pulling clicks.",
    tipNegative: "Your CTAs may not be reading — test sharper wording.",
  },
  offer_present: {
    plainName: "Promotional offer",
    phrase: "ads featuring an offer",
    tipPositive: "Offers are driving conversions. Bundle them into more creatives.",
    tipNegative: "Heavy discounting may be hurting margin — test value-led messaging.",
  },
  urgency_cue: {
    plainName: "Urgency language",
    phrase: "ads with urgency cues",
    tipPositive: "Urgency phrases (\"today only\", \"limited time\") are pulling action. Test more deliberately.",
    tipNegative: "Urgency phrases may be wearing out the audience.",
  },
  social_proof: {
    plainName: "Social-proof messaging",
    phrase: "ads using social proof",
    tipPositive: "Testimonials and ratings are working. Get more of them on camera.",
    tipNegative: "Your social-proof angle isn't landing — test a stronger benefit hook.",
  },
  headline_present: {
    plainName: "Headline text",
    phrase: "ads with a written headline",
    tipPositive: "Strong headlines are doing real work. Keep iterating on copy.",
    tipNegative: "Wordy headlines may be hurting — test visual-first creatives.",
  },
  price_shown: {
    plainName: "Price displayed",
    phrase: "ads showing the price",
    tipPositive: "Transparent pricing is converting. Lean into it.",
    tipNegative: "Showing price up front may be filtering too aggressively.",
  },
  brand_colours_used: {
    plainName: "Brand colours",
    phrase: "on-brand-coloured ads",
    tipPositive: "Brand recall is helping. Stay on-palette.",
    tipNegative: "Test bolder, off-brand palettes for top-of-funnel.",
  },
  colour_palette: {
    plainName: "Colour palette",
    phrase: "ads in this colour palette",
    tipPositive: "This palette is outperforming. Try it on more creatives.",
    tipNegative: "This palette is under-performing. Swap it out.",
  },
  contrast: {
    plainName: "Visual contrast",
    phrase: "high-contrast ads",
    tipPositive: "High-contrast creatives are catching the eye in feed.",
    tipNegative: "Low contrast may be losing you scroll-time. Bump it up.",
  },
  message_angle: {
    plainName: "Message angle",
    phrase: "ads with this message angle",
    tipPositive: "This angle is resonating. Brief writers to lean in.",
    tipNegative: "This angle is under-performing. Try a different hook.",
  },
  creative_format: {
    plainName: "Format",
    phrase: "this creative format",
    tipPositive: "This format is your strongest. Brief more like it.",
    tipNegative: "This format is dragging. Test alternatives.",
  },
  text_density: {
    plainName: "Amount of text",
    phrase: "ads with this text density",
    tipPositive: "This level of text is working. Stay there.",
    tipNegative: "Test less (or more) text to find the sweet spot.",
  },
  visual_clutter: {
    plainName: "Visual clutter",
    phrase: "cluttered ads",
    tipPositive: "Surprisingly, busier frames are working here.",
    tipNegative: "Cleaner, simpler frames win. Tighten your hero shots.",
  },
  funnel_stage: {
    plainName: "Funnel stage",
    phrase: "ads at this funnel stage",
    tipPositive: "This funnel stage is over-delivering. Shift budget here.",
    tipNegative: "This stage is dragging. Investigate creative-fit.",
  },
  lifestyle_vs_studio: {
    plainName: "Lifestyle vs. studio",
    phrase: "lifestyle-style ads",
    tipPositive: "Lifestyle framing wins. Brief more in-context shoots.",
    tipNegative: "Studio shots are working better. Test cleaner setups.",
  },
  number_of_people: {
    plainName: "Number of people",
    phrase: "ads with this many people",
    tipPositive: "This group-size sweet spot is converting.",
    tipNegative: "Group size may be wrong for your audience. Test variants.",
  },
  product_count: {
    plainName: "Product count",
    phrase: "ads showing this product count",
    tipPositive: "This product count is winning.",
    tipNegative: "Test a different product count in the frame.",
  },
};

export function getVariableCopy(variableName: string): VariableCopy {
  const c = VARIABLE_COPY[variableName];
  if (c) return c;
  const fallback = variableName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  return {
    plainName: fallback,
    phrase: `ads with this ${variableName.replace(/_/g, " ")}`,
    tipPositive: "Worth testing more of this in future creatives.",
    tipNegative: "Worth investigating — this is dragging performance.",
  };
}

// ─── Metric explanations ──────────────────────────────────────────

export const METRIC_EXPLAIN: Record<MetricKey, { name: string; sentence: (value: number) => string }> = {
  ctr: {
    name: "Click-through rate",
    sentence: (v) => `About ${v.toFixed(1)} out of every 100 people who saw your ad clicked it.`,
  },
  cpc: {
    name: "Cost per click",
    sentence: (v) => `You paid about ${v < 1 ? Math.round(v * 100) + " cents" : "$" + v.toFixed(2)} each time someone clicked.`,
  },
  cpa: {
    name: "Cost per action",
    sentence: (v) => `Each conversion costs you about $${v.toFixed(2)}.`,
  },
  cvr: {
    name: "Conversion rate",
    sentence: (v) => `Of those who clicked, about ${Math.round(v)} in 100 took the desired action.`,
  },
  roas: {
    name: "Return on ad spend",
    sentence: (v) => `For every $1 you spent on ads, you got $${v.toFixed(2)} back in revenue.`,
  },
};

// ─── Metric labels (lowercase, plain) ─────────────────────────────

export const METRIC_PLAIN_NAME: Record<MetricKey, string> = {
  ctr: "click-through rate",
  cpc: "cost per click",
  cpa: "cost per action",
  cvr: "conversion rate",
  roas: "return on ad spend",
};

// ─── Recommendation priority list ─────────────────────────────────
// Variables to prefer when picking the top 3 actionable recommendations.
// Falls back to insight order if no curated match found.

export const RECOMMENDATION_PRIORITY: string[] = [
  "human_present",
  "face_visible",
  "urgency_cue",
  "offer_present",
  "social_proof",
  "lifestyle_vs_studio",
  "cta_present",
  "visual_clutter",
  "text_density",
  "colour_palette",
];

// ─── Performance-tier labels (for gallery in Simplified mode) ─────

export function tierForRank(rank: number, total: number): { label: string; tone: "good" | "ok" | "bad" } {
  const pct = rank / total;
  if (pct < 0.2) return { label: "Top performer", tone: "good" };
  if (pct < 0.5) return { label: "Above average", tone: "good" };
  if (pct < 0.8) return { label: "Around average", tone: "ok" };
  return { label: "Needs work", tone: "bad" };
}

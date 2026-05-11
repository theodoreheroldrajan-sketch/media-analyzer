/**
 * Variable schema definitions — universal + category templates.
 *
 * Each variable has a name, type, source, and optional enum_values.
 * The `enabled` flag is toggled by the user on the variables page.
 */

import type { VariableDefinition } from "@/types/database";

// ─── Universal variables ─────────────────────────────────────────
// Applied to every project. All enabled by default.

export const UNIVERSAL_VARIABLES: VariableDefinition[] = [
  // Format & layout
  {
    name: "creative_format",
    type: "enum",
    enum_values: [
      "static_image",
      "carousel_card",
      "story_frame",
      "banner",
      "square_post",
      "other",
    ],
    description: "Type of ad creative format",
    source: "universal",
    enabled: true,
  },
  {
    name: "aspect_ratio",
    type: "enum",
    enum_values: ["1:1", "4:5", "9:16", "16:9", "other"],
    description: "Image aspect ratio",
    source: "universal",
    enabled: true,
  },

  // Visual elements
  {
    name: "primary_visual_subject",
    type: "string",
    description: "Main subject of the image (e.g. person, product, landscape)",
    source: "universal",
    enabled: true,
  },
  {
    name: "product_visible",
    type: "boolean",
    description: "Whether the product is visible in the creative",
    source: "universal",
    enabled: true,
  },
  {
    name: "human_present",
    type: "boolean",
    description: "Whether a human is present in the creative",
    source: "universal",
    enabled: true,
  },
  {
    name: "face_visible",
    type: "boolean",
    description: "Whether a human face is clearly visible",
    source: "universal",
    enabled: true,
  },
  {
    name: "number_of_people",
    type: "integer",
    description: "Count of people visible in the creative",
    source: "universal",
    enabled: true,
  },

  // Colour & style
  {
    name: "colour_palette",
    type: "enum",
    enum_values: ["warm", "cool", "neutral", "vibrant", "muted", "dark", "light"],
    description: "Dominant colour temperature/mood",
    source: "universal",
    enabled: true,
  },
  {
    name: "contrast",
    type: "enum",
    enum_values: ["high", "medium", "low"],
    description: "Visual contrast level",
    source: "universal",
    enabled: true,
  },

  // Text & copy
  {
    name: "text_overlay",
    type: "boolean",
    description: "Whether text is overlaid on the image",
    source: "universal",
    enabled: true,
  },
  {
    name: "text_density",
    type: "enum",
    enum_values: ["none", "minimal", "moderate", "heavy"],
    description: "Amount of text on the creative",
    source: "universal",
    enabled: true,
  },

  // Brand
  {
    name: "logo_visible",
    type: "boolean",
    description: "Whether the brand logo is visible",
    source: "universal",
    enabled: true,
  },
  {
    name: "brand_colours_used",
    type: "boolean",
    description: "Whether brand colours are dominant",
    source: "universal",
    enabled: true,
  },
  {
    name: "visual_clutter",
    type: "enum",
    enum_values: ["minimal", "moderate", "cluttered"],
    description: "Overall visual complexity/clutter",
    source: "universal",
    enabled: true,
  },

  // CTA & messaging
  {
    name: "headline_present",
    type: "boolean",
    description: "Whether a headline text is present",
    source: "universal",
    enabled: true,
  },
  {
    name: "cta_present",
    type: "boolean",
    description: "Whether a call-to-action is present",
    source: "universal",
    enabled: true,
  },
  {
    name: "cta_text",
    type: "string",
    description: "The CTA text if present (e.g. 'Shop Now', 'Learn More')",
    source: "universal",
    enabled: true,
  },
  {
    name: "offer_present",
    type: "boolean",
    description: "Whether a promotional offer is shown",
    source: "universal",
    enabled: true,
  },
  {
    name: "price_shown",
    type: "boolean",
    description: "Whether a price is displayed",
    source: "universal",
    enabled: true,
  },
  {
    name: "urgency_cue",
    type: "boolean",
    description: "Whether urgency language is used (limited time, last chance, etc.)",
    source: "universal",
    enabled: true,
  },
  {
    name: "social_proof",
    type: "boolean",
    description: "Whether social proof is present (reviews, ratings, testimonials)",
    source: "universal",
    enabled: true,
  },

  // Strategy
  {
    name: "message_angle",
    type: "enum",
    enum_values: [
      "benefit",
      "feature",
      "problem_solution",
      "testimonial",
      "lifestyle",
      "comparison",
      "emotional",
      "other",
    ],
    description: "Primary messaging angle/approach",
    source: "universal",
    enabled: true,
  },
  {
    name: "primary_hook",
    type: "string",
    description: "The main hook or attention-grabber",
    source: "universal",
    enabled: true,
  },
  {
    name: "funnel_stage",
    type: "enum",
    enum_values: ["awareness", "consideration", "conversion", "retention"],
    description: "Target funnel stage for this creative",
    source: "universal",
    enabled: true,
  },
];

// ─── Category variable templates ─────────────────────────────────
// Loaded based on the brand_category selected in project setup.

const CATEGORY_TEMPLATES: Record<string, VariableDefinition[]> = {
  ecommerce: [
    {
      name: "product_category",
      type: "enum",
      enum_values: ["apparel", "electronics", "beauty", "home", "food", "accessories", "other"],
      description: "Product category shown in the creative",
      source: "category",
      enabled: true,
    },
    {
      name: "discount_percentage",
      type: "integer",
      description: "Discount percentage if shown (0 if none)",
      source: "category",
      enabled: true,
    },
    {
      name: "free_shipping_mentioned",
      type: "boolean",
      description: "Whether free shipping is mentioned",
      source: "category",
      enabled: true,
    },
    {
      name: "product_count",
      type: "enum",
      enum_values: ["single", "multiple", "collection"],
      description: "Number of products featured",
      source: "category",
      enabled: true,
    },
    {
      name: "lifestyle_vs_studio",
      type: "enum",
      enum_values: ["lifestyle", "studio", "flat_lay", "on_model", "mixed"],
      description: "Product photography style",
      source: "category",
      enabled: true,
    },
    {
      name: "user_generated_content",
      type: "boolean",
      description: "Whether the creative appears to be UGC-style",
      source: "category",
      enabled: true,
    },
  ],

  saas: [
    {
      name: "screenshot_visible",
      type: "boolean",
      description: "Whether a product screenshot or UI is shown",
      source: "category",
      enabled: true,
    },
    {
      name: "feature_highlighted",
      type: "string",
      description: "The specific feature being highlighted",
      source: "category",
      enabled: true,
    },
    {
      name: "demo_or_free_trial",
      type: "boolean",
      description: "Whether a demo or free trial is offered",
      source: "category",
      enabled: true,
    },
    {
      name: "social_proof_type",
      type: "enum",
      enum_values: ["customer_logo", "testimonial", "stat", "award", "none"],
      description: "Type of social proof used",
      source: "category",
      enabled: true,
    },
    {
      name: "integration_mentioned",
      type: "boolean",
      description: "Whether integrations with other tools are mentioned",
      source: "category",
      enabled: true,
    },
  ],

  fintech: [
    {
      name: "trust_signal",
      type: "enum",
      enum_values: ["security_badge", "regulatory", "encryption", "guarantee", "none"],
      description: "Type of trust/security signal used",
      source: "category",
      enabled: true,
    },
    {
      name: "financial_figure_shown",
      type: "boolean",
      description: "Whether specific numbers/returns are shown",
      source: "category",
      enabled: true,
    },
    {
      name: "app_screenshot",
      type: "boolean",
      description: "Whether the app UI is shown",
      source: "category",
      enabled: true,
    },
    {
      name: "simplicity_messaging",
      type: "boolean",
      description: "Whether ease-of-use is a messaging theme",
      source: "category",
      enabled: true,
    },
  ],

  food_delivery: [
    {
      name: "food_photography_style",
      type: "enum",
      enum_values: ["overhead", "close_up", "lifestyle", "flat_lay", "action"],
      description: "Food photography angle/style",
      source: "category",
      enabled: true,
    },
    {
      name: "cuisine_type",
      type: "string",
      description: "Type of cuisine shown",
      source: "category",
      enabled: true,
    },
    {
      name: "delivery_time_shown",
      type: "boolean",
      description: "Whether delivery time is mentioned",
      source: "category",
      enabled: true,
    },
    {
      name: "promo_code_shown",
      type: "boolean",
      description: "Whether a promo/coupon code is displayed",
      source: "category",
      enabled: true,
    },
  ],

  gaming: [
    {
      name: "gameplay_shown",
      type: "boolean",
      description: "Whether actual gameplay is visible",
      source: "category",
      enabled: true,
    },
    {
      name: "character_featured",
      type: "boolean",
      description: "Whether a game character is featured prominently",
      source: "category",
      enabled: true,
    },
    {
      name: "reward_shown",
      type: "boolean",
      description: "Whether in-game rewards or items are shown",
      source: "category",
      enabled: true,
    },
    {
      name: "difficulty_implied",
      type: "enum",
      enum_values: ["easy", "challenging", "competitive", "unclear"],
      description: "Implied difficulty level of the game",
      source: "category",
      enabled: true,
    },
  ],

  dating: [
    {
      name: "couple_shown",
      type: "boolean",
      description: "Whether a couple is shown",
      source: "category",
      enabled: true,
    },
    {
      name: "success_story",
      type: "boolean",
      description: "Whether a success story or real match is featured",
      source: "category",
      enabled: true,
    },
    {
      name: "app_feature_highlighted",
      type: "string",
      description: "Specific app feature shown (e.g. video call, profile prompts)",
      source: "category",
      enabled: true,
    },
    {
      name: "safety_messaging",
      type: "boolean",
      description: "Whether safety or verification features are highlighted",
      source: "category",
      enabled: true,
    },
    {
      name: "diversity_shown",
      type: "boolean",
      description: "Whether diverse demographics are represented",
      source: "category",
      enabled: true,
    },
  ],

  education: [
    {
      name: "credential_shown",
      type: "boolean",
      description: "Whether certificates or credentials are shown",
      source: "category",
      enabled: true,
    },
    {
      name: "instructor_visible",
      type: "boolean",
      description: "Whether an instructor or teacher is visible",
      source: "category",
      enabled: true,
    },
    {
      name: "outcome_promise",
      type: "boolean",
      description: "Whether career/learning outcomes are promised",
      source: "category",
      enabled: true,
    },
    {
      name: "platform_ui_shown",
      type: "boolean",
      description: "Whether the learning platform interface is shown",
      source: "category",
      enabled: true,
    },
  ],

  health_fitness: [
    {
      name: "before_after",
      type: "boolean",
      description: "Whether before/after comparison is shown",
      source: "category",
      enabled: true,
    },
    {
      name: "body_type_shown",
      type: "enum",
      enum_values: ["athletic", "average", "aspirational", "diverse", "not_applicable"],
      description: "Body type representation in the creative",
      source: "category",
      enabled: true,
    },
    {
      name: "workout_shown",
      type: "boolean",
      description: "Whether exercise or workout activity is shown",
      source: "category",
      enabled: true,
    },
    {
      name: "nutrition_mentioned",
      type: "boolean",
      description: "Whether nutrition or diet is mentioned",
      source: "category",
      enabled: true,
    },
  ],

  travel: [
    {
      name: "destination_type",
      type: "enum",
      enum_values: ["beach", "city", "mountain", "resort", "cultural", "adventure", "other"],
      description: "Type of travel destination shown",
      source: "category",
      enabled: true,
    },
    {
      name: "price_anchor",
      type: "boolean",
      description: "Whether a starting price is shown",
      source: "category",
      enabled: true,
    },
    {
      name: "experience_vs_property",
      type: "enum",
      enum_values: ["experience", "property", "both"],
      description: "Whether the focus is on the experience or the accommodation",
      source: "category",
      enabled: true,
    },
    {
      name: "seasonal_theme",
      type: "boolean",
      description: "Whether seasonal or holiday theming is used",
      source: "category",
      enabled: true,
    },
  ],

  real_estate: [
    {
      name: "property_type",
      type: "enum",
      enum_values: ["apartment", "house", "villa", "commercial", "plot", "other"],
      description: "Type of property shown",
      source: "category",
      enabled: true,
    },
    {
      name: "interior_exterior",
      type: "enum",
      enum_values: ["interior", "exterior", "aerial", "floor_plan", "mixed"],
      description: "Photography focus",
      source: "category",
      enabled: true,
    },
    {
      name: "emi_shown",
      type: "boolean",
      description: "Whether EMI or financing options are displayed",
      source: "category",
      enabled: true,
    },
    {
      name: "location_highlighted",
      type: "boolean",
      description: "Whether the location/neighbourhood is a key message",
      source: "category",
      enabled: true,
    },
  ],
};

// Fallback for categories not in the template
const GENERIC_CATEGORY: VariableDefinition[] = [
  {
    name: "industry_specific_element",
    type: "string",
    description: "Primary industry-specific element in the creative",
    source: "category",
    enabled: true,
  },
  {
    name: "competitor_differentiation",
    type: "boolean",
    description: "Whether competitive differentiation is present",
    source: "category",
    enabled: true,
  },
  {
    name: "emotional_tone",
    type: "enum",
    enum_values: ["aspirational", "humorous", "serious", "playful", "urgent", "calm", "empathetic"],
    description: "Emotional tone of the creative",
    source: "category",
    enabled: true,
  },
];

/**
 * Get category variables for a given brand category.
 * Maps the brand_category string from setup to a template key.
 */
export function getCategoryVariables(brandCategory: string): VariableDefinition[] {
  // Normalise the category name to match template keys
  const normalised = brandCategory
    .toLowerCase()
    .trim()
    .replace(/[\s\-&/]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  // Direct match
  if (CATEGORY_TEMPLATES[normalised]) {
    return CATEGORY_TEMPLATES[normalised];
  }

  // Partial match
  for (const [key, vars] of Object.entries(CATEGORY_TEMPLATES)) {
    if (normalised.includes(key) || key.includes(normalised)) {
      return vars;
    }
  }

  return GENERIC_CATEGORY;
}

/**
 * Build the full default variable schema for a project.
 */
export function buildDefaultSchema(brandCategory: string): VariableDefinition[] {
  return [
    ...UNIVERSAL_VARIABLES,
    ...getCategoryVariables(brandCategory),
  ];
}

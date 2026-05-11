import Link from "next/link";

const UNIVERSAL_VARS: [string, string][] = [
  ["creative_format", "enum"],
  ["aspect_ratio", "enum"],
  ["primary_visual_subject", "string"],
  ["product_visible", "boolean"],
  ["human_present", "boolean"],
  ["face_visible", "boolean"],
  ["number_of_people", "integer"],
  ["colour_palette", "enum"],
  ["contrast", "enum"],
  ["text_overlay", "boolean"],
  ["text_density", "enum"],
  ["logo_visible", "boolean"],
  ["brand_colours_used", "boolean"],
  ["visual_clutter", "enum"],
  ["headline_present", "boolean"],
  ["cta_present", "boolean"],
  ["cta_text", "string"],
  ["offer_present", "boolean"],
  ["price_shown", "boolean"],
  ["urgency_cue", "boolean"],
  ["social_proof", "boolean"],
  ["message_angle", "enum"],
  ["primary_hook", "string"],
  ["funnel_stage", "enum"],
];

export default function VariablesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 06 of 09</p>
        <h1 className="page-title">Approve the variable schema</h1>
        <p className="page-sub">
          These are the variables the AI will extract from each creative. Keep
          the schema tight — every variable you add is more cost and a smaller
          per-bucket sample size.
        </p>
      </div>

      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">1 · Universal variables</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Applied to every project. All on by default — uncheck any you
              don&apos;t need.
            </p>
          </div>
          <span className="badge mono">
            {UNIVERSAL_VARS.length} / {UNIVERSAL_VARS.length} included
          </span>
        </div>
        <div style={{ marginTop: 14, columnCount: 2, columnGap: 28 }}>
          {UNIVERSAL_VARS.map(([name, type]) => (
            <label
              className="checkbox-row"
              key={name}
              style={{ breakInside: "avoid" as const }}
            >
              <input type="checkbox" defaultChecked readOnly />
              <span className="cb-name">{name}</span>
              <span className="cb-type">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">2 · Category variables</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Loaded from the brand category template you picked in setup.
            </p>
          </div>
          <span className="badge mono">— / — included</span>
        </div>
        <p className="muted mt-2" style={{ fontSize: 13 }}>
          Complete setup first to load category-specific variables.
        </p>
      </div>

      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">3 · AI-suggested variables</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Generated from your brand context and a sample of uploaded
              creatives. None are auto-added.
            </p>
          </div>
          <button className="btn" disabled>
            Ask AI to suggest variables
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">4 · Custom variables</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              Add anything specific to your hypothesis.
            </p>
          </div>
          <button className="btn" disabled>
            + Add custom variable
          </button>
        </div>
      </div>

      <div className="page-actions">
        <Link href="/mapping" className="btn">
          ← Back
        </Link>
        <div className="spacer" />
        <p className="mono" style={{ fontSize: 12, marginRight: 14 }}>
          <strong>{UNIVERSAL_VARS.length}</strong> variables in final schema
        </p>
        <button className="btn btn-primary" disabled>
          Approve schema &amp; continue →
        </button>
      </div>
    </div>
  );
}

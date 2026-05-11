import Link from "next/link";

const CATEGORIES = [
  "Generic ecommerce",
  "Food/restaurant",
  "App install",
  "Matrimony/dating",
  "Local service",
  "B2B lead generation",
  "Personal brand/content creator",
];
const KPIS = ["CTR", "CPC", "CPA", "CVR", "ROAS"];
const PLATFORMS = ["Meta Ads", "Google Ads", "Generic/Other"];

export default function SetupPage() {
  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 02 of 09</p>
        <h1 className="page-title">Set up your project</h1>
        <p className="page-sub">
          Tell us about the brand and what you&apos;re optimising for. This
          context shapes the variable schema and the way insights are framed.
        </p>
      </div>

      <div className="panel" style={{ maxWidth: 820 }}>
        <h3 className="panel-title">Brand context</h3>
        <p className="panel-sub">
          All fields except where marked optional are required for analysis to
          produce useful results.
        </p>

        <div className="field-row">
          <div className="field">
            <label className="label">
              Project name<span className="req">*</span>
            </label>
            <input
              className="input"
              placeholder="Spring launch — Meta video"
            />
          </div>
          <div className="field">
            <label className="label">
              Brand name<span className="req">*</span>
            </label>
            <input className="input" placeholder="Acme" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label">
              Brand category<span className="req">*</span>
            </label>
            <select className="select" defaultValue="">
              <option value="" disabled>
                Select category…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="hint">
              Used to load category-specific variables in the next step.
            </p>
          </div>
          <div className="field">
            <label className="label">
              Platform / source<span className="req">*</span>
            </label>
            <select className="select" defaultValue="">
              <option value="" disabled>
                Select platform…
              </option>
              {PLATFORMS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="hint">
              Determines expected CSV columns and naming conventions.
            </p>
          </div>
        </div>

        <div className="field">
          <label className="label">Campaign goal</label>
          <input
            className="input"
            placeholder="App installs, lead generation, online sales…"
          />
        </div>

        <div className="field">
          <label className="label">Target audience</label>
          <textarea
            className="textarea"
            placeholder="Urban Indian singles, 25-34, English-speaking, salaried professionals in metros…"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label">
              Primary KPI<span className="req">*</span>
            </label>
            <select className="select" defaultValue="">
              <option value="" disabled>
                Select KPI…
              </option>
              {KPIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">
              Tone / positioning <span className="muted">(optional)</span>
            </label>
            <input
              className="input"
              placeholder="Bold, irreverent, value-conscious…"
            />
          </div>
        </div>
      </div>

      <div className="page-actions">
        <Link href="/" className="btn">
          ← Back
        </Link>
        <div className="spacer" />
        <Link href="/instructions" className="btn btn-primary">
          Save &amp; continue →
        </Link>
      </div>
    </div>
  );
}

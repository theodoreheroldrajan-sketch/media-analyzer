import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 09 of 09</p>
        <h1 className="page-title">Project settings</h1>
        <p className="page-sub">
          Manage brand context, export data, see API usage, or delete this
          project.
        </p>
      </div>

      <div className="panel">
        <h3 className="panel-title">Export data</h3>
        <p className="panel-sub">
          Download CSVs of the underlying data behind the dashboard. Re-import
          to other tools as needed.
        </p>
        <div className="btn-row mt-2" style={{ flexWrap: "wrap" }}>
          <button className="btn" disabled>
            ↓ Variables CSV{" "}
            <span className="muted mono" style={{ marginLeft: 6, fontSize: 11 }}>
              — rows · — cols
            </span>
          </button>
          <button className="btn" disabled>
            ↓ Performance CSV{" "}
            <span className="muted mono" style={{ marginLeft: 6, fontSize: 11 }}>
              — rows · — cols
            </span>
          </button>
          <button className="btn" disabled>
            ↓ Combined analysis CSV{" "}
            <span className="muted mono" style={{ marginLeft: 6, fontSize: 11 }}>
              — rows · — cols
            </span>
          </button>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">API usage</h3>
        <p className="panel-sub">Lifetime usage for this project.</p>
        <div className="kv-grid mt-2">
          <div className="kv-row">
            <div className="k">total_analysis_runs</div>
            <div className="v">0</div>
          </div>
          <div className="kv-row">
            <div className="k">total_tokens_used</div>
            <div className="v">0</div>
          </div>
          <div className="kv-row">
            <div className="k">total_cost_usd</div>
            <div className="v">$0.00</div>
          </div>
          <div className="kv-row">
            <div className="k">last_run</div>
            <div className="v mono" style={{ fontSize: 12 }}>
              —
            </div>
          </div>
        </div>
      </div>

      <div
        className="panel"
        style={{ borderColor: "oklch(0.85 0.06 25)" }}
      >
        <h3 className="panel-title" style={{ color: "var(--red)" }}>
          Danger zone
        </h3>
        <p className="panel-sub">Destructive actions. Cannot be undone.</p>
        <div
          className="between"
          style={{
            padding: "12px 0 0",
            borderTop: "1px solid var(--border)",
            marginTop: 8,
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Delete this project
            </p>
            <p
              className="muted"
              style={{ margin: "2px 0 0", fontSize: 12 }}
            >
              Removes all creatives, mappings, extracted variables, and
              dashboard data.
            </p>
          </div>
          <button className="btn btn-danger" disabled>
            Delete project
          </button>
        </div>
      </div>

      <div className="page-actions">
        <Link href="/dashboard" className="btn">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}

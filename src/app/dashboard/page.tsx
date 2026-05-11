import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <p className="page-eyebrow">Step 08 of 09</p>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">
          Dataset health, top-line metrics, and which variables correlate with
          the metric you care about.
        </p>
      </div>

      {/* Trust score */}
      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">Dataset trust score</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              A composite of six sub-scores. Read it before reading anything
              else on this page.
            </p>
          </div>
          <span className="badge">No data yet</span>
        </div>
        <div className="trust-card mt-3">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="gauge-ring"
              style={
                {
                  "--p": 0,
                  "--c": "var(--border-strong)",
                  margin: "0 auto",
                } as React.CSSProperties
              }
            >
              <div className="gauge-ring-inner">
                <span className="trust-gauge-num">—</span>
                <span className="trust-gauge-max">/100</span>
                <p className="trust-level mono">— · No data</p>
              </div>
            </div>
          </div>
          <div className="trust-bars">
            {[
              "Creative count",
              "Volume (impressions)",
              "Mapping quality",
              "Data completeness",
              "Extraction confidence",
              "Bucket balance",
            ].map((label) => (
              <div key={label}>
                <div className="trust-bar-label">
                  <span>{label}</span>
                  <span className="mono">—</span>
                </div>
                <div className="trust-bar-track">
                  <div className="trust-bar-fill" style={{ width: 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div className="panel">
        <h3 className="panel-title">Key metrics</h3>
        <p className="panel-sub">
          Aggregated across mapped creatives only. Metrics that lack source data
          are not shown.
        </p>
        <div className="stat-grid mt-2">
          {[
            "Creatives analysed",
            "Total impressions",
            "Total clicks",
            "Total spend",
            "Avg CTR",
            "Avg CPC",
          ].map((label) => (
            <div className="stat" key={label}>
              <p className="stat-label">{label}</p>
              <p className="stat-value">—</p>
              <p className="stat-sub">no data</p>
            </div>
          ))}
        </div>
      </div>

      {/* Variable performance */}
      <div className="panel">
        <div className="between">
          <div>
            <h3 className="panel-title">Variable performance</h3>
            <p className="panel-sub" style={{ marginBottom: 0 }}>
              How each variable value performs against the chosen metric. Rows
              with n &lt; 3 show &quot;insufficient data&quot;.
            </p>
          </div>
          <div className="row">
            <span className="muted" style={{ fontSize: 12 }}>
              Metric:
            </span>
            <select className="select" style={{ width: 110 }} defaultValue="CTR">
              {["CTR", "CPC", "CPA", "CVR", "ROAS"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="tbl-wrap mt-2">
          <table className="tbl">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Value</th>
                <th>Count (n)</th>
                <th>Avg CTR</th>
                <th>vs Overall</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "var(--text-3)",
                  }}
                >
                  Run an analysis first to see variable performance data.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Creative gallery */}
      <div className="panel">
        <div className="between">
          <h3 className="panel-title">Creative gallery — sorted by CTR</h3>
          <span className="badge mono">best → worst</span>
        </div>
        <p
          className="muted mt-2"
          style={{ fontSize: 13, textAlign: "center", padding: 32 }}
        >
          Analysed creatives will appear here sorted by performance.
        </p>
      </div>

      {/* Insights */}
      <div className="panel">
        <div className="between">
          <h3 className="panel-title">AI insights</h3>
          <span className="badge mono">0 patterns surfaced</span>
        </div>
        <p
          className="muted mt-2"
          style={{ fontSize: 13, textAlign: "center", padding: 32 }}
        >
          AI-generated insights will appear here after analysis is complete.
        </p>
      </div>

      {/* Warnings */}
      <div className="panel">
        <h3 className="panel-title">Data quality warnings</h3>
        <p className="panel-sub">
          Things we noticed that may affect the reliability of the findings
          above.
        </p>
        <p
          className="muted"
          style={{ fontSize: 13, textAlign: "center", padding: 16 }}
        >
          No warnings. Upload data to begin.
        </p>
      </div>

      <div className="page-actions">
        <Link href="/analysis" className="btn">
          ← Back to analysis
        </Link>
        <div className="spacer" />
        <Link href="/settings" className="btn">
          Project settings →
        </Link>
      </div>
    </div>
  );
}

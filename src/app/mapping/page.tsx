import Link from "next/link";

export default function MappingPage() {
  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 05 of 09</p>
        <h1 className="page-title">
          Review creative ↔ performance mapping
        </h1>
        <p className="page-sub">
          Auto-matched rows are linked already. Suggested matches need explicit
          confirmation. Unmatched creatives must be linked manually or
          they&apos;ll be excluded.
        </p>
      </div>

      <div className="summary-bar">
        <div className="summary-stat">
          <span className="summary-stat-num">—</span>
          <span className="summary-stat-label">Total creatives</span>
        </div>
        <div className="divider" />
        <div className="summary-stat">
          <span className="summary-stat-num" style={{ color: "var(--green)" }}>
            —
          </span>
          <span className="summary-stat-label">Auto-matched</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-num" style={{ color: "var(--amber)" }}>
            —
          </span>
          <span className="summary-stat-label">Suggested</span>
        </div>
        <div className="summary-stat">
          <span className="summary-stat-num" style={{ color: "var(--red)" }}>
            —
          </span>
          <span className="summary-stat-label">Unmatched</span>
        </div>
        <div className="quality">
          <p className="summary-stat-label">Mapping quality</p>
          <p className="summary-stat-num">—%</p>
        </div>
      </div>

      <div className="panel" style={{ padding: 14 }}>
        <p className="muted" style={{ fontSize: 13, padding: 12 }}>
          Upload creatives and CSV first. The mapping engine will run
          automatically and show results here for your review.
        </p>
      </div>

      <div className="page-actions">
        <Link href="/upload" className="btn">
          ← Back
        </Link>
        <div className="spacer" />
        <button className="btn btn-primary" disabled>
          Confirm reviewed mappings &amp; continue →
        </button>
      </div>
    </div>
  );
}

"use client";

export default function MappingSummaryBar({
  total,
  autoMatched,
  suggested,
  unmatched,
}: {
  total: number;
  autoMatched: number;
  suggested: number;
  unmatched: number;
}) {
  const quality = total > 0 ? Math.round((autoMatched / total) * 100) : 0;
  const qualityColor =
    quality >= 90 ? "var(--green)" : quality >= 75 ? "var(--amber)" : "var(--red)";

  return (
    <div className="mapping-summary-bar">
      <div className="mapping-summary-stat">
        <span className="mapping-summary-num mono">{total}</span>
        <span className="mapping-summary-label">Total creatives</span>
      </div>
      <div className="summary-divider" />

      <div className="mapping-summary-stat">
        <span className="mapping-summary-num mono" style={{ color: "var(--green)" }}>
          {autoMatched}
        </span>
        <span className="mapping-summary-label">Auto-matched</span>
      </div>
      <div className="summary-divider" />

      <div className="mapping-summary-stat">
        <span className="mapping-summary-num mono" style={{ color: "var(--amber)" }}>
          {suggested}
        </span>
        <span className="mapping-summary-label">Suggested</span>
      </div>
      <div className="summary-divider" />

      <div className="mapping-summary-stat">
        <span className="mapping-summary-num mono" style={{ color: "var(--red)" }}>
          {unmatched}
        </span>
        <span className="mapping-summary-label">Unmatched</span>
      </div>

      <div style={{ marginLeft: "auto", textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
          Mapping quality
        </div>
        <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: qualityColor }}>
          {quality}%
        </div>
      </div>
    </div>
  );
}

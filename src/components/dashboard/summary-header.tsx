"use client";

import type { KeyMetrics } from "@/lib/analytics";

export default function SummaryHeader({
  keyMetrics,
  creativeCount,
  regressionReady,
  regressionThreshold,
}: {
  keyMetrics: KeyMetrics;
  creativeCount: number;
  regressionReady: boolean;
  regressionThreshold: number;
}) {
  return (
    <div className="summary-header">
      <div className="summary-stats">
        <div className="summary-stat">
          <span className="summary-stat-value mono">
            {creativeCount}
          </span>
          <span className="summary-stat-label">creatives</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-stat-value mono">
            {keyMetrics.totalImpressions >= 1000000
              ? `${(keyMetrics.totalImpressions / 1000000).toFixed(1)}M`
              : keyMetrics.totalImpressions >= 1000
                ? `${(keyMetrics.totalImpressions / 1000).toFixed(0)}K`
                : keyMetrics.totalImpressions.toLocaleString()}
          </span>
          <span className="summary-stat-label">impressions</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-stat-value mono">
            ${keyMetrics.totalSpend >= 1000
              ? `${(keyMetrics.totalSpend / 1000).toFixed(1)}K`
              : keyMetrics.totalSpend.toLocaleString()}
          </span>
          <span className="summary-stat-label">total spend</span>
        </div>
        <div className="summary-divider" />
        <div className="summary-stat">
          <span className="summary-stat-value mono">
            {keyMetrics.avgROAS.toFixed(2)}x
          </span>
          <span className="summary-stat-label">avg ROAS</span>
        </div>
      </div>

      {/* Regression indicator */}
      <div
        className="regression-indicator"
        style={{
          borderColor: regressionReady ? "var(--green)" : "var(--border)",
          background: regressionReady ? "var(--green-soft)" : "var(--surface-2)",
        }}
      >
        <span style={{ fontSize: 14 }}>
          {regressionReady ? "🔓" : "🔒"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="regression-label">
            {regressionReady
              ? "Regression analysis unlocked"
              : "Regression analysis"}
          </p>
          <p className="regression-sub muted">
            {regressionReady
              ? `${creativeCount} creatives — coefficients, p-values, and interaction terms available.`
              : `${creativeCount}/${regressionThreshold} creatives · group-by analysis active`}
          </p>
        </div>
        {!regressionReady && (
          <div className="regression-bar-wrap">
            <div className="regression-bar-track">
              <div
                className="regression-bar-fill"
                style={{
                  width: `${Math.min(100, (creativeCount / regressionThreshold) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

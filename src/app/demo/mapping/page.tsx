"use client";

import Link from "next/link";
import { useDemo } from "@/context/demo-context";

export default function DemoMappingPage() {
  const { creatives, performanceRows } = useDemo();

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 03 · Demo</p>
        <h1 className="page-title">Mapping</h1>
        <p className="page-sub">
          Each creative image is matched to its performance data row. All{" "}
          {creatives.length} creatives are auto-matched in this demo.
        </p>
      </div>

      {/* Summary bar */}
      <div className="summary-bar">
        <div className="summary-stat">
          <span className="summary-stat-num">{creatives.length}</span>
          <span className="summary-stat-label">Total</span>
        </div>
        <div className="divider" />
        <div className="summary-stat">
          <span className="summary-stat-num" style={{ color: "var(--green)" }}>
            {creatives.length}
          </span>
          <span className="summary-stat-label">Auto-matched</span>
        </div>
        <div className="divider" />
        <div className="summary-stat">
          <span className="summary-stat-num">0</span>
          <span className="summary-stat-label">Unmatched</span>
        </div>
        <div className="quality">
          <span className="badge badge-green">100% match rate</span>
        </div>
      </div>

      {/* Mapping table */}
      <div className="panel">
        <h3 className="panel-title">Confirmed mappings</h3>
        <div className="tbl-wrap mt-2">
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Creative</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>Spend</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {creatives.slice(0, 20).map((c, i) => {
                const perf = performanceRows.find((p) => p.creativeId === c.id);
                return (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                      {i + 1}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {c.filename}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {perf?.impressions.toLocaleString() ?? "—"}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {perf?.clicks.toLocaleString() ?? "—"}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>
                      ${perf?.spend.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"}
                    </td>
                    <td>
                      <span className="badge badge-green">confirmed</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {creatives.length > 20 && (
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Showing 20 of {creatives.length} mappings.
          </p>
        )}
      </div>

      <div className="page-actions">
        <Link href="/demo/upload" className="btn">
          ← Back to upload
        </Link>
        <div className="spacer" />
        <Link href="/demo/variables" className="btn btn-primary">
          Continue to variables →
        </Link>
      </div>
    </div>
  );
}

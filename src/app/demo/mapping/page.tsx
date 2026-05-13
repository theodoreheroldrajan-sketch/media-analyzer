"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import DemoModeGuard from "@/components/demo-mode-guard";
import MappingSummaryBar from "@/components/mapping/mapping-summary-bar";
import MatchCard from "@/components/mapping/match-card";
import type { DemoCreative, DemoPerformanceRow, DemoDataSet } from "@/lib/demo-data";

function MappingContent() {
  const { data, mode } = useDemo();
  if (!data) return null;

  if (mode === "lite") {
    return <LiteMapping creatives={data.creatives} performanceRows={data.performanceRows} />;
  }
  return <ProMapping data={data} />;
}

function LiteMapping({
  creatives,
  performanceRows,
}: {
  creatives: DemoCreative[];
  performanceRows: DemoPerformanceRow[];
}) {
  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 04 · Demo (Lite)</p>
        <h1 className="page-title">Mapping</h1>
        <p className="page-sub">
          Each creative image is matched to its performance data row. All{" "}
          {creatives.length} creatives are auto-matched in this demo.
        </p>
      </div>

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
                    <td className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{i + 1}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{c.filename}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{perf?.impressions.toLocaleString() ?? "—"}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{perf?.clicks.toLocaleString() ?? "—"}</td>
                    <td className="mono" style={{ fontSize: 12 }}>${perf?.spend.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? "—"}</td>
                    <td><span className="badge badge-green">confirmed</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {creatives.length > 20 && (
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Showing 20 of {creatives.length} mappings.</p>
        )}
      </div>

      <div className="page-actions">
        <Link href="/demo/upload" className="btn">← Back to upload</Link>
        <div className="spacer" />
        <Link href="/demo/variables" className="btn btn-primary">Continue to variables →</Link>
      </div>
    </div>
  );
}

function ProMapping({ data }: { data: DemoDataSet }) {
  const { creatives, performanceRows, matchSplit } = data;

  // Track status of each suggested match
  const [suggestedStatus, setSuggestedStatus] = useState<Record<string, "pending" | "confirmed" | "rejected">>(() => {
    const init: Record<string, "pending" | "confirmed" | "rejected"> = {};
    matchSplit?.suggested.forEach((s) => { init[s.creativeId] = "pending"; });
    return init;
  });

  if (!matchSplit) return null;

  const autoCount = matchSplit.autoMatched.length;
  const pendingSuggested = matchSplit.suggested.filter((s) => suggestedStatus[s.creativeId] === "pending").length;
  const confirmedSuggested = matchSplit.suggested.filter((s) => suggestedStatus[s.creativeId] === "confirmed").length;
  const totalUnmatched = matchSplit.unmatched.length + matchSplit.suggested.filter((s) => suggestedStatus[s.creativeId] === "rejected").length;

  const creativesById = new Map(creatives.map((c) => [c.id, c]));
  const perfById = new Map(performanceRows.map((p) => [p.id, p]));

  return (
    <div className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <p className="page-eyebrow">Step 04 · Demo (Pro)</p>
        <h1 className="page-title">Creative-to-performance mapping</h1>
        <p className="page-sub">
          Six-method cascade automatically matched the majority. Review suggested
          matches below and handle any unmatched creatives manually.
        </p>
      </div>

      <MappingSummaryBar
        total={creatives.length}
        autoMatched={autoCount + confirmedSuggested}
        suggested={pendingSuggested}
        unmatched={totalUnmatched}
      />

      {/* Suggested matches */}
      {pendingSuggested > 0 && (
        <div className="panel mt-2">
          <div className="between">
            <div>
              <h3 className="panel-title">Suggested matches · review needed</h3>
              <p className="panel-sub" style={{ marginBottom: 0 }}>
                Lower-confidence matches from fuzzy / ad name methods. Confirm
                or reject each one.
              </p>
            </div>
            <span className="badge badge-amber mono">{pendingSuggested} pending</span>
          </div>
          <div className="match-card-list mt-3">
            {matchSplit.suggested.map((s) => {
              const status = suggestedStatus[s.creativeId];
              if (status !== "pending") return null;
              const c = creativesById.get(s.creativeId);
              if (!c) return null;
              const perf = perfById.get(s.suggestedPerfRowId);
              return (
                <MatchCard
                  key={s.creativeId}
                  filename={c.filename}
                  hue={c.hue}
                  status="suggested"
                  confidence={s.confidence}
                  method={s.method}
                  impressions={perf?.impressions}
                  clicks={perf?.clicks}
                  spend={perf?.spend}
                  perfRowLabel={`perf_row_${s.suggestedPerfRowId.slice(-3)}`}
                  onConfirm={() => setSuggestedStatus({ ...suggestedStatus, [s.creativeId]: "confirmed" })}
                  onReject={() => setSuggestedStatus({ ...suggestedStatus, [s.creativeId]: "rejected" })}
                  onChange={() => alert("Manual override: in real app, opens row picker dropdown")}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Unmatched */}
      {matchSplit.unmatched.length > 0 && (
        <div className="panel mt-2">
          <div className="between">
            <div>
              <h3 className="panel-title">Unmatched creatives</h3>
              <p className="panel-sub" style={{ marginBottom: 0 }}>
                No suitable performance row found automatically. Pick manually
                or skip — they&apos;ll be excluded from analysis.
              </p>
            </div>
            <span className="badge badge-red mono">{matchSplit.unmatched.length} unmatched</span>
          </div>
          <div className="match-card-list mt-3">
            {matchSplit.unmatched.map((cid) => {
              const c = creativesById.get(cid);
              if (!c) return null;
              return (
                <MatchCard
                  key={cid}
                  filename={c.filename}
                  hue={c.hue}
                  status="unmatched"
                  onChange={() => alert("Manual match: in real app, opens row picker")}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Auto-matched (collapsed sample) */}
      <div className="panel mt-2">
        <details>
          <summary style={{ cursor: "pointer" }}>
            <span className="panel-title" style={{ display: "inline" }}>
              Auto-matched · {autoCount + confirmedSuggested}
            </span>
            <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>
              click to expand
            </span>
          </summary>
          <div className="match-card-list mt-3">
            {matchSplit.autoMatched.slice(0, 8).map((cid) => {
              const c = creativesById.get(cid);
              if (!c) return null;
              const perf = performanceRows.find((p) => p.creativeId === cid);
              return (
                <MatchCard
                  key={cid}
                  filename={c.filename}
                  hue={c.hue}
                  status="auto"
                  confidence={1.0}
                  method="exact"
                  impressions={perf?.impressions}
                  clicks={perf?.clicks}
                  spend={perf?.spend}
                />
              );
            })}
            {matchSplit.autoMatched.length > 8 && (
              <p className="muted" style={{ fontSize: 12, textAlign: "center", padding: 12 }}>
                ... and {matchSplit.autoMatched.length - 8} more auto-matched
              </p>
            )}
          </div>
        </details>
      </div>

      <div className="page-actions">
        <Link href="/demo/upload" className="btn">← Back to upload</Link>
        <div className="spacer" />
        <Link href="/demo/variables" className="btn btn-primary">Continue to variables →</Link>
      </div>
    </div>
  );
}

export default function DemoMappingPage() {
  return (
    <DemoModeGuard>
      <MappingContent />
    </DemoModeGuard>
  );
}

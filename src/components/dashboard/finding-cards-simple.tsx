"use client";

import { useMemo } from "react";
import {
  noiseAdjustedRank,
  type MetricKey,
  type VariablePerformance,
} from "@/lib/analytics";
import { getVariableCopy, METRIC_PLAIN_NAME } from "@/lib/simplified-copy";

const METRIC_LABEL: Record<MetricKey, string> = {
  ctr: "click-through rate",
  cpc: "cost per click",
  cpa: "cost per action",
  cvr: "conversion rate",
  roas: "return on ad spend",
};

function isLowerBetter(metric: MetricKey): boolean {
  return metric === "cpc" || metric === "cpa";
}

function metricFormat(metric: MetricKey, v: number): string {
  if (metric === "ctr" || metric === "cvr") return `${v.toFixed(2)}%`;
  if (metric === "cpc" || metric === "cpa") return `$${v.toFixed(2)}`;
  return `${v.toFixed(2)}x`;
}

function confidenceBadge(c: VariablePerformance["confidence"]): { label: string; klass: string } {
  if (c === "high") return { label: "Confident", klass: "badge-green" };
  if (c === "medium") return { label: "Likely", klass: "badge-green" };
  if (c === "low") return { label: "Tentative", klass: "badge-amber" };
  return { label: "Needs more data", klass: "badge-amber" };
}

type Finding = {
  variable: string;
  bestRow: VariablePerformance;
  rank: number;
  goodDirection: boolean;
};

export default function FindingCardsSimple({
  varPerf,
  metric,
}: {
  varPerf: VariablePerformance[];
  metric: MetricKey;
}) {
  const findings = useMemo<Finding[]>(() => {
    // Group rows by variable
    const grouped = new Map<string, VariablePerformance[]>();
    for (const vp of varPerf) {
      if (vp.confidence === "insufficient") continue;
      if (!grouped.has(vp.variable)) grouped.set(vp.variable, []);
      grouped.get(vp.variable)!.push(vp);
    }

    // For each variable, pick the row whose absolute delta is largest
    const perVariable: Finding[] = [];
    grouped.forEach((rows, variable) => {
      if (rows.length === 0) return;
      let best = rows[0];
      for (const r of rows) {
        if (Math.abs(r.delta) > Math.abs(best.delta)) best = r;
      }
      const lowerBetter = isLowerBetter(metric);
      const goodDirection = lowerBetter ? best.delta < 0 : best.delta > 0;
      perVariable.push({
        variable,
        bestRow: best,
        rank: noiseAdjustedRank(best),
        goodDirection,
      });
    });

    // Sort by signal strength (noise-adjusted rank), descending
    perVariable.sort((a, b) => b.rank - a.rank);
    return perVariable.slice(0, 5);
  }, [varPerf, metric]);

  if (findings.length === 0) {
    return (
      <div className="panel">
        <h3 className="panel-title">Top findings</h3>
        <p className="muted" style={{ fontSize: 13, textAlign: "center", padding: 32 }}>
          Not enough data yet to surface findings. Upload more creatives or try another metric.
        </p>
      </div>
    );
  }

  // For bar scaling — use the largest absolute delta across the top 5
  const maxAbsDelta = findings.reduce((m, f) => Math.max(m, Math.abs(f.bestRow.delta)), 0);

  return (
    <div className="panel">
      <h3 className="panel-title">Top findings — {METRIC_LABEL[metric]}</h3>
      <p className="panel-sub">
        The 5 biggest patterns we found across your creatives, ordered by signal strength.
      </p>

      <div className="finding-list mt-3">
        {findings.map((f) => {
          const copy = getVariableCopy(f.variable);
          const conf = confidenceBadge(f.bestRow.confidence);
          const pct = Math.abs(f.bestRow.delta);
          const pctStr = `${pct.toFixed(0)}%`;
          const direction = f.goodDirection ? "higher" : "lower";
          const lowerBetter = isLowerBetter(metric);

          const headline = lowerBetter
            ? `${copy.plainName.charAt(0).toUpperCase() + copy.plainName.slice(1)}: ${f.bestRow.value} has ${pctStr} ${direction} ${METRIC_LABEL[metric]}`
            : `${copy.plainName.charAt(0).toUpperCase() + copy.plainName.slice(1)}: ${f.bestRow.value} drives ${pctStr} ${direction} ${METRIC_LABEL[metric]}`;

          const detail = `${f.bestRow.count} of your creatives match this. Their average ${METRIC_PLAIN_NAME[metric]} is ${metricFormat(metric, f.bestRow.avgMetric)} versus ${metricFormat(metric, f.bestRow.overallAvg)} across the rest.`;

          const tip = f.goodDirection ? copy.tipPositive : copy.tipNegative;

          // Bar widths — scale against the largest absolute delta in the top 5
          const thisDeltaPct = maxAbsDelta > 0 ? (pct / maxAbsDelta) * 100 : 0;
          const otherDeltaPct = 0; // baseline = 0% deviation from overall

          const thisLabel = `${f.bestRow.variable.replace(/_/g, " ")} = ${f.bestRow.value}`;
          const otherLabel = "Everything else";

          return (
            <div
              key={`${f.variable}-${f.bestRow.value}`}
              className={`finding-card ${f.goodDirection ? "finding-good" : "finding-bad"}`}
            >
              <div className="between" style={{ alignItems: "flex-start", gap: 12 }}>
                <h4 className="finding-headline">{headline}</h4>
                <span className={`badge mono ${conf.klass}`} style={{ flexShrink: 0, fontSize: 10 }}>
                  {conf.label}
                </span>
              </div>
              <p className="finding-detail">{detail}</p>

              <div className="finding-bars">
                <div className="finding-bar-row">
                  <span className="finding-bar-label">{thisLabel}</span>
                  <div className="finding-bar-track">
                    <div
                      className="finding-bar-fill"
                      style={{
                        width: `${Math.max(4, thisDeltaPct)}%`,
                        background: f.goodDirection ? "var(--green)" : "var(--red)",
                      }}
                    />
                  </div>
                  <span className="finding-bar-value mono">
                    {metricFormat(metric, f.bestRow.avgMetric)}
                  </span>
                </div>
                <div className="finding-bar-row">
                  <span className="finding-bar-label">{otherLabel}</span>
                  <div className="finding-bar-track">
                    <div
                      className="finding-bar-fill"
                      style={{
                        width: `${Math.max(4, otherDeltaPct)}%`,
                        background: "var(--surface-highest)",
                      }}
                    />
                  </div>
                  <span className="finding-bar-value mono">
                    {metricFormat(metric, f.bestRow.overallAvg)}
                  </span>
                </div>
              </div>

              <p className="finding-tip">{tip}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

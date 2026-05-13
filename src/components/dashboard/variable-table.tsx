"use client";

import { useState, useMemo } from "react";
import type { MetricKey, VariablePerformance } from "@/lib/analytics";

const METRIC_LABELS: Record<MetricKey, string> = {
  ctr: "CTR (%)",
  cpc: "CPC",
  cpa: "CPA",
  cvr: "CVR (%)",
  roas: "ROAS",
};

const METRIC_FORMAT: Record<MetricKey, (v: number) => string> = {
  ctr: (v) => `${v.toFixed(2)}%`,
  cpc: (v) => `$${v.toFixed(2)}`,
  cpa: (v) => `$${v.toFixed(2)}`,
  cvr: (v) => `${v.toFixed(2)}%`,
  roas: (v) => `${v.toFixed(2)}x`,
};

type SortKey = "variable" | "value" | "count" | "avgMetric" | "delta" | "confidence";
type SortDir = "asc" | "desc";

const CONF_ORDER = { high: 3, medium: 2, low: 1, insufficient: 0 };

export default function VariableTable({
  varPerf,
  metric,
}: {
  varPerf: VariablePerformance[];
  metric: MetricKey;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("delta");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterVar, setFilterVar] = useState<string>("all");

  // Get unique variable names for filter
  const variableNames = useMemo(() => {
    const names = new Set(varPerf.map((v) => v.variable));
    return Array.from(names).sort();
  }, [varPerf]);

  // Filter + sort
  const displayed = useMemo(() => {
    let data = filterVar === "all" ? varPerf : varPerf.filter((v) => v.variable === filterVar);

    data = [...data].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "variable": cmp = a.variable.localeCompare(b.variable); break;
        case "value": cmp = a.value.localeCompare(b.value); break;
        case "count": cmp = a.count - b.count; break;
        case "avgMetric": cmp = a.avgMetric - b.avgMetric; break;
        case "delta": cmp = Math.abs(a.delta) - Math.abs(b.delta); break;
        case "confidence": cmp = CONF_ORDER[a.confidence] - CONF_ORDER[b.confidence]; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return data;
  }, [varPerf, filterVar, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  return (
    <div className="panel">
      <div className="between">
        <div>
          <h3 className="panel-title">Variable performance table</h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Click any column header to sort. Rows with n &lt; 3 show insufficient data.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="muted" style={{ fontSize: 12 }}>Filter:</span>
          <select
            className="select"
            style={{ width: 160, fontSize: 12 }}
            value={filterVar}
            onChange={(e) => setFilterVar(e.target.value)}
          >
            <option value="all">All variables</option>
            {variableNames.map((n) => (
              <option key={n} value={n}>{n.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tbl-wrap mt-2">
        <table className="tbl">
          <thead>
            <tr>
              <th onClick={() => handleSort("variable")} style={{ cursor: "pointer" }}>
                Variable{sortIcon("variable")}
              </th>
              <th onClick={() => handleSort("value")} style={{ cursor: "pointer" }}>
                Value{sortIcon("value")}
              </th>
              <th onClick={() => handleSort("count")} style={{ cursor: "pointer" }}>
                Count (n){sortIcon("count")}
              </th>
              <th onClick={() => handleSort("avgMetric")} style={{ cursor: "pointer" }}>
                Avg {METRIC_LABELS[metric]}{sortIcon("avgMetric")}
              </th>
              <th onClick={() => handleSort("delta")} style={{ cursor: "pointer" }}>
                vs Overall{sortIcon("delta")}
              </th>
              <th onClick={() => handleSort("confidence")} style={{ cursor: "pointer" }}>
                Confidence{sortIcon("confidence")}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--text-3)" }}>
                  No variable performance data available.
                </td>
              </tr>
            ) : (
              displayed.slice(0, 80).map((vp, i) => (
                <tr key={`${vp.variable}-${vp.value}-${i}`}>
                  <td className="mono" style={{ fontSize: 12 }}>{vp.variable}</td>
                  <td style={{ fontSize: 12 }}>{vp.value}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{vp.count}</td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {vp.confidence === "insufficient" ? "—" : METRIC_FORMAT[metric](vp.avgMetric)}
                  </td>
                  <td
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color:
                        vp.confidence === "insufficient"
                          ? "var(--text-3)"
                          : vp.delta > 0
                            ? metric === "cpc" || metric === "cpa" ? "var(--red)" : "var(--green)"
                            : vp.delta < 0
                              ? metric === "cpc" || metric === "cpa" ? "var(--green)" : "var(--red)"
                              : "var(--text-2)",
                    }}
                  >
                    {vp.confidence === "insufficient" ? "—" : `${vp.delta > 0 ? "+" : ""}${vp.delta.toFixed(1)}%`}
                  </td>
                  <td>
                    <span
                      className="badge mono"
                      style={{
                        fontSize: 10,
                        color:
                          vp.confidence === "high" ? "var(--green)" :
                          vp.confidence === "medium" ? "var(--amber)" :
                          vp.confidence === "low" ? "var(--red)" :
                          "var(--text-3)",
                      }}
                    >
                      {vp.confidence === "insufficient" ? "n < 3" : vp.confidence}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {displayed.length > 80 && (
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Showing top 80 of {displayed.length} rows.
        </p>
      )}
    </div>
  );
}

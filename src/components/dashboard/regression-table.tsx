"use client";

import { useState } from "react";
import type { RegressionModel } from "@/lib/demo-data";

type SortKey = "variable" | "coefficient" | "stdError" | "tStat" | "pValue" | "standardizedCoef";
type SortDir = "asc" | "desc";

export default function RegressionTable({ model }: { model: RegressionModel }) {
  const [sortKey, setSortKey] = useState<SortKey>("tStat");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [onlySignificant, setOnlySignificant] = useState(false);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  let coefs = [...model.coefficients];
  if (onlySignificant) coefs = coefs.filter((c) => c.significant);

  coefs.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "variable": cmp = a.variable.localeCompare(b.variable); break;
      case "coefficient": cmp = a.coefficient - b.coefficient; break;
      case "stdError": cmp = a.stdError - b.stdError; break;
      case "tStat": cmp = Math.abs(a.tStat) - Math.abs(b.tStat); break;
      case "pValue": cmp = a.pValue - b.pValue; break;
      case "standardizedCoef": cmp = Math.abs(a.standardizedCoef) - Math.abs(b.standardizedCoef); break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const sigCount = model.coefficients.filter((c) => c.significant).length;

  return (
    <div className="panel">
      <div className="between">
        <div>
          <h3 className="panel-title">Regression coefficients</h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Multiple linear regression on{" "}
            <strong>{model.metric.toUpperCase()}</strong>. {sigCount} of {model.coefficients.length} predictors significant at p &lt; 0.05. Click any column to sort.
          </p>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={onlySignificant}
            onChange={(e) => setOnlySignificant(e.target.checked)}
          />
          Significant only
        </label>
      </div>

      {/* Model fit summary */}
      <div className="regression-fit-row mt-2">
        <div className="regression-fit-stat">
          <span className="regression-fit-label">R²</span>
          <span className="mono regression-fit-value">{model.modelR2.toFixed(3)}</span>
        </div>
        <div className="regression-fit-stat">
          <span className="regression-fit-label">Adj. R²</span>
          <span className="mono regression-fit-value">{model.adjustedR2.toFixed(3)}</span>
        </div>
        <div className="regression-fit-stat">
          <span className="regression-fit-label">Model p</span>
          <span className="mono regression-fit-value" style={{ color: "var(--green)" }}>
            {model.modelPValue < 0.001 ? "< 0.001" : model.modelPValue.toFixed(4)}
          </span>
        </div>
        <div className="regression-fit-stat">
          <span className="regression-fit-label">Max VIF</span>
          <span className="mono regression-fit-value">{model.vifMax.toFixed(2)}</span>
        </div>
        <div className="regression-fit-stat">
          <span className="regression-fit-label">n</span>
          <span className="mono regression-fit-value">{model.nObservations}</span>
        </div>
      </div>

      <div className="tbl-wrap mt-2">
        <table className="tbl regression-tbl">
          <thead>
            <tr>
              <th onClick={() => handleSort("variable")} style={{ cursor: "pointer" }}>
                Variable / Value{sortIcon("variable")}
              </th>
              <th onClick={() => handleSort("coefficient")} style={{ cursor: "pointer", textAlign: "right" }}>
                β (coef){sortIcon("coefficient")}
              </th>
              <th onClick={() => handleSort("stdError")} style={{ cursor: "pointer", textAlign: "right" }}>
                SE{sortIcon("stdError")}
              </th>
              <th onClick={() => handleSort("tStat")} style={{ cursor: "pointer", textAlign: "right" }}>
                t-stat{sortIcon("tStat")}
              </th>
              <th onClick={() => handleSort("pValue")} style={{ cursor: "pointer", textAlign: "right" }}>
                p-value{sortIcon("pValue")}
              </th>
              <th style={{ textAlign: "right" }}>95% CI</th>
              <th onClick={() => handleSort("standardizedCoef")} style={{ cursor: "pointer", textAlign: "right" }}>
                Std. β{sortIcon("standardizedCoef")}
              </th>
              <th>Sig.</th>
            </tr>
          </thead>
          <tbody>
            {coefs.map((c, i) => (
              <tr key={`${c.variable}-${c.value}-${i}`} className={c.significant ? "row-significant" : ""}>
                <td className="mono" style={{ fontSize: 12 }}>
                  {c.variable.replace(/_/g, " ")}
                  <span style={{ color: "var(--text-3)" }}> = </span>
                  <span style={{ color: "var(--text-2)" }}>{c.value}</span>
                </td>
                <td className="mono" style={{ fontSize: 12, textAlign: "right", color: c.coefficient > 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                  {c.coefficient > 0 ? "+" : ""}{c.coefficient.toFixed(3)}
                </td>
                <td className="mono" style={{ fontSize: 12, textAlign: "right", color: "var(--text-2)" }}>
                  {c.stdError.toFixed(3)}
                </td>
                <td className="mono" style={{ fontSize: 12, textAlign: "right" }}>
                  {c.tStat > 0 ? "+" : ""}{c.tStat.toFixed(2)}
                </td>
                <td className="mono" style={{ fontSize: 12, textAlign: "right", color: c.significant ? "var(--green)" : "var(--text-3)" }}>
                  {c.pValue < 0.001 ? "< 0.001" : c.pValue.toFixed(3)}
                </td>
                <td className="mono" style={{ fontSize: 11, textAlign: "right", color: "var(--text-2)" }}>
                  [{c.ci95Lower.toFixed(2)}, {c.ci95Upper.toFixed(2)}]
                </td>
                <td className="mono" style={{ fontSize: 12, textAlign: "right" }}>
                  {c.standardizedCoef > 0 ? "+" : ""}{c.standardizedCoef.toFixed(2)}
                </td>
                <td>
                  {c.significant && (
                    <span style={{ color: "var(--green)", fontSize: 14, fontWeight: 600 }}>★</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        ★ = significant at p &lt; 0.05. Standardised coefficient (Std. β) lets you compare effect sizes across variables on different scales.
      </p>
    </div>
  );
}

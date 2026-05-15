"use client";

import { useState, useMemo } from "react";
import { benjaminiHochberg } from "@/lib/analytics";
import type { RegressionCoefficient, RegressionModel } from "@/lib/demo-data";

type SortKey = "variable" | "coefficient" | "stdError" | "tStat" | "pValue" | "standardizedCoef";
type SortDir = "asc" | "desc";

type CoefRow = RegressionCoefficient & {
  adjustedP?: number; // present for exploratory section only
  isSignificantAdj?: boolean; // recomputed using adjusted p when present
};

function sortCoefs(coefs: CoefRow[], sortKey: SortKey, sortDir: SortDir): CoefRow[] {
  const out = [...coefs];
  out.sort((a, b) => {
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
  return out;
}

function CoefficientsTable({
  coefs,
  sortKey,
  sortDir,
  onSort,
  showAdjustedP,
}: {
  coefs: CoefRow[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  showAdjustedP: boolean;
}) {
  function sortIcon(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  return (
    <div className="tbl-wrap mt-2">
      <table className="tbl regression-tbl">
        <thead>
          <tr>
            <th onClick={() => onSort("variable")} style={{ cursor: "pointer" }}>
              Variable / Value{sortIcon("variable")}
            </th>
            <th onClick={() => onSort("coefficient")} style={{ cursor: "pointer", textAlign: "right" }}>
              β (coef){sortIcon("coefficient")}
            </th>
            <th onClick={() => onSort("stdError")} style={{ cursor: "pointer", textAlign: "right" }}>
              SE{sortIcon("stdError")}
            </th>
            <th onClick={() => onSort("tStat")} style={{ cursor: "pointer", textAlign: "right" }}>
              t-stat{sortIcon("tStat")}
            </th>
            <th onClick={() => onSort("pValue")} style={{ cursor: "pointer", textAlign: "right" }}>
              p (raw){sortIcon("pValue")}
            </th>
            {showAdjustedP && (
              <th style={{ textAlign: "right" }} title="Benjamini-Hochberg FDR-adjusted p-value">
                p (BH-adj.)
              </th>
            )}
            <th style={{ textAlign: "right" }}>95% CI</th>
            <th onClick={() => onSort("standardizedCoef")} style={{ cursor: "pointer", textAlign: "right" }}>
              Std. β{sortIcon("standardizedCoef")}
            </th>
            <th>Sig.</th>
          </tr>
        </thead>
        <tbody>
          {coefs.length === 0 ? (
            <tr>
              <td colSpan={showAdjustedP ? 9 : 8} style={{ textAlign: "center", padding: 24, color: "var(--text-3)" }}>
                No coefficients in this section.
              </td>
            </tr>
          ) : (
            coefs.map((c, i) => {
              const sig = showAdjustedP ? c.isSignificantAdj : c.significant;
              return (
                <tr key={`${c.variable}-${c.value}-${i}`} className={sig ? "row-significant" : ""}>
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
                  {showAdjustedP && (
                    <td className="mono" style={{ fontSize: 12, textAlign: "right", color: c.isSignificantAdj ? "var(--green)" : "var(--text-3)" }}>
                      {c.adjustedP === undefined
                        ? "—"
                        : c.adjustedP < 0.001
                          ? "< 0.001"
                          : c.adjustedP.toFixed(3)}
                    </td>
                  )}
                  <td className="mono" style={{ fontSize: 11, textAlign: "right", color: "var(--text-2)" }}>
                    [{c.ci95Lower.toFixed(2)}, {c.ci95Upper.toFixed(2)}]
                  </td>
                  <td className="mono" style={{ fontSize: 12, textAlign: "right" }}>
                    {c.standardizedCoef > 0 ? "+" : ""}{c.standardizedCoef.toFixed(2)}
                  </td>
                  <td>
                    {sig && (
                      <span style={{ color: "var(--green)", fontSize: 14, fontWeight: 600 }}>★</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function RegressionTable({
  model,
  hypothesisVariables = [],
}: {
  model: RegressionModel;
  hypothesisVariables?: string[];
}) {
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

  // Partition coefficients into pre-registered hypotheses vs exploratory
  const { hypothesisRows, exploratoryRows } = useMemo(() => {
    const hypSet = new Set(hypothesisVariables);
    const hypCoefs: CoefRow[] = [];
    const expCoefs: CoefRow[] = [];

    for (const c of model.coefficients) {
      if (hypSet.has(c.variable)) {
        hypCoefs.push({ ...c });
      } else {
        expCoefs.push({ ...c });
      }
    }

    // Apply BH-FDR to exploratory p-values only
    if (expCoefs.length > 0) {
      const rawPs = expCoefs.map((c) => c.pValue);
      const adj = benjaminiHochberg(rawPs);
      for (let i = 0; i < expCoefs.length; i++) {
        expCoefs[i].adjustedP = adj[i];
        expCoefs[i].isSignificantAdj = adj[i] < 0.05;
      }
    }

    return { hypothesisRows: hypCoefs, exploratoryRows: expCoefs };
  }, [model.coefficients, hypothesisVariables]);

  const filterFn = (c: CoefRow) =>
    !onlySignificant ||
    (c.isSignificantAdj === undefined ? c.significant : c.isSignificantAdj);

  const sortedHypothesis = sortCoefs(hypothesisRows.filter(filterFn), sortKey, sortDir);
  const sortedExploratory = sortCoefs(exploratoryRows.filter(filterFn), sortKey, sortDir);

  const totalSig = sortedExploratory.filter((c) => c.isSignificantAdj).length +
    sortedHypothesis.filter((c) => c.significant).length;

  return (
    <div className="panel">
      <div className="between">
        <div>
          <h3 className="panel-title">Regression coefficients</h3>
          <p className="panel-sub" style={{ marginBottom: 0 }}>
            Multiple linear regression on{" "}
            <strong>{model.metric.toUpperCase()}</strong>. {totalSig} of{" "}
            {model.coefficients.length} predictors significant. Exploratory
            variables go through Benjamini-Hochberg FDR correction.
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

      {hypothesisVariables.length > 0 && (
        <>
          <h4
            className="mono"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginTop: 18,
              marginBottom: 0,
              color: "var(--red)",
            }}
          >
            Hypotheses tested ({hypothesisRows.length})
          </h4>
          <p
            className="muted"
            style={{ fontSize: 11, marginTop: 4, marginBottom: 0 }}
          >
            Pre-registered variables. Raw p-values used for significance — no
            multiple-comparisons penalty applied.
          </p>
          <CoefficientsTable
            coefs={sortedHypothesis}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            showAdjustedP={false}
          />
        </>
      )}

      <h4
        className="mono"
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginTop: hypothesisVariables.length > 0 ? 22 : 14,
          marginBottom: 0,
          color: "var(--text-2)",
        }}
      >
        {hypothesisVariables.length > 0
          ? `Exploratory (${exploratoryRows.length}) — BH-FDR adjusted`
          : `All coefficients (${exploratoryRows.length}) — BH-FDR adjusted`}
      </h4>
      <p
        className="muted"
        style={{ fontSize: 11, marginTop: 4, marginBottom: 0 }}
      >
        Benjamini-Hochberg adjusted p-values control the false discovery rate
        across {exploratoryRows.length} comparisons.
        Significance flag uses the adjusted value.
      </p>
      <CoefficientsTable
        coefs={sortedExploratory}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        showAdjustedP={true}
      />

      <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
        ★ = significant at p &lt; 0.05 (adjusted for exploratory variables, raw
        for hypotheses). Standardised coefficient (Std. β) lets you compare
        effect sizes across variables on different scales.
      </p>
    </div>
  );
}

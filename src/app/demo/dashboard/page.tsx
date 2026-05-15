"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useDemo } from "@/context/demo-context";
import DemoModeGuard from "@/components/demo-mode-guard";
import {
  computeModelStability,
  countPredictors,
  type MetricKey,
} from "@/lib/analytics";
import { getDemoVariables } from "@/lib/demo-data";

import MetricSwitcher from "@/components/dashboard/metric-switcher";
import SummaryHeader from "@/components/dashboard/summary-header";
import TrustScorePanel, {
  type ModelStabilityInfo,
} from "@/components/dashboard/trust-score-panel";
import KeyMetricsPanel from "@/components/dashboard/key-metrics-panel";
import VariableExplorer from "@/components/dashboard/variable-explorer";
import VariableTable from "@/components/dashboard/variable-table";
import CreativeGallery from "@/components/dashboard/creative-gallery";
import InsightsPanel from "@/components/dashboard/insights-panel";
import RegressionTable from "@/components/dashboard/regression-table";
import InteractionMatrix from "@/components/dashboard/interaction-matrix";

const ENABLED_VARS_KEY = "media-analyzer-enabled-vars";
const HYPOTHESIS_VARS_KEY = "media-analyzer-hypothesis-vars";

function DashboardContent() {
  const { data, mode } = useDemo();
  const [metric, setMetric] = useState<MetricKey>("ctr");
  const [enabledVars, setEnabledVars] = useState<Record<string, boolean> | null>(
    null
  );
  const [hypothesisVars, setHypothesisVars] = useState<string[]>([]);

  // Read enabled-vars and hypothesis selections from the /variables page
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(ENABLED_VARS_KEY);
      if (raw) setEnabledVars(JSON.parse(raw));
      const rawHyp = window.localStorage.getItem(HYPOTHESIS_VARS_KEY);
      if (rawHyp) {
        const parsed = JSON.parse(rawHyp);
        if (Array.isArray(parsed)) setHypothesisVars(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Compute model stability (Pro only) from enabled predictors
  const modelStability = useMemo<ModelStabilityInfo | undefined>(() => {
    if (mode !== "pro" || !data) return undefined;
    const demoVars = getDemoVariables();
    const active = enabledVars
      ? demoVars.filter((v) => enabledVars[v.name] !== false)
      : demoVars;
    const predictorCount = countPredictors(active);
    const creativeCount = data.creativeData.length;
    const ratio = predictorCount > 0 ? creativeCount / predictorCount : 0;
    return {
      color: computeModelStability(creativeCount, predictorCount),
      ratio,
      predictorCount,
      creativeCount,
    };
  }, [mode, data, enabledVars]);

  if (!data) return null;
  const isPro = mode === "pro";
  const payload = data.dashboards[metric];

  return (
    <div className="page" style={{ maxWidth: "1400px" }}>
      <div className="page-head">
        <p className="page-eyebrow">
          Step 07 · Demo ({mode === "pro" ? "Pro" : "Lite"})
        </p>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">
          {isPro
            ? "Full statistical analysis across 120 creatives. Switch chart types in the variable explorer, sort the regression table by significance, and drill into variable interactions."
            : "Explore which creative variables correlate with better performance. Switch metrics, explore variables, and click creatives for detail."}
        </p>
      </div>

      <MetricSwitcher metric={metric} onChange={setMetric} />

      <SummaryHeader
        keyMetrics={payload.keyMetrics}
        creativeCount={payload.creativeCount}
        regressionReady={payload.regressionReady}
        regressionThreshold={payload.regressionThreshold}
      />

      <div className="dashboard-trust-metrics mb-2">
        <TrustScorePanel
          trustScore={payload.trustScore}
          modelStability={modelStability}
        />
        <KeyMetricsPanel keyMetrics={payload.keyMetrics} metric={metric} />
      </div>

      <VariableExplorer
        varPerf={payload.variablePerformance}
        metric={metric}
        isPro={isPro}
        creativeData={data.creativeData}
        interactions={data.variableInteractions}
      />

      {/* Pro-only: regression table */}
      {isPro && data.regressionModels && (
        <RegressionTable
          model={data.regressionModels[metric]}
          hypothesisVariables={hypothesisVars}
        />
      )}

      {/* Pro-only: interaction matrix */}
      {isPro && data.variableInteractions && (
        <InteractionMatrix
          interactions={data.variableInteractions}
          metric={metric}
        />
      )}

      <VariableTable
        varPerf={payload.variablePerformance}
        metric={metric}
        hypothesisVariables={hypothesisVars}
      />

      <CreativeGallery
        gallery={payload.gallery}
        metric={metric}
        creativeData={data.creativeData}
      />

      <InsightsPanel
        insights={data.insights}
        hypothesisVariables={hypothesisVars}
      />

      <div className="page-actions">
        <Link href="/demo/analysis" className="btn">← Back to analysis</Link>
        <div className="spacer" />
        <Link href="/demo" className="btn">Return to mode chooser</Link>
      </div>
    </div>
  );
}

export default function DemoDashboardPage() {
  return (
    <DemoModeGuard>
      <DashboardContent />
    </DemoModeGuard>
  );
}

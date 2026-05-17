"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDemo } from "@/context/demo-context";
import DemoModeGuard from "@/components/demo-mode-guard";
import {
  computeModelStability,
  countPredictors,
  type MetricKey,
} from "@/lib/analytics";
import { useLocalStorage } from "@/lib/use-local-storage";
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
import ViewModeSwitcher from "@/components/dashboard/view-mode-switcher";
import FindingCardsSimple from "@/components/dashboard/finding-cards-simple";
import RecommendationsSimple from "@/components/dashboard/recommendations-simple";
import HeadsUpCard from "@/components/dashboard/heads-up-card";

const ENABLED_VARS_KEY = "media-analyzer-enabled-vars";
const HYPOTHESIS_VARS_KEY = "media-analyzer-hypothesis-vars";

function DashboardContent() {
  const { data, mode, viewMode } = useDemo();
  const [metric, setMetric] = useState<MetricKey>("ctr");

  // React 19: useSyncExternalStore-backed localStorage hook (lib/use-local-storage)
  // replaces the old useEffect+setState pattern.
  const enabledVars = useLocalStorage<Record<string, boolean> | null>(
    ENABLED_VARS_KEY,
    null
  );
  const hypothesisVars = useLocalStorage<string[]>(HYPOTHESIS_VARS_KEY, []);

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
  const isSimple = isPro && viewMode === "simple";
  const payload = data.dashboards[metric];

  return (
    <div className="page" style={{ maxWidth: "1400px" }}>
      <div className="dashboard-header-row">
        <div className="page-head">
          <p className="page-eyebrow">
            Step 07 · Demo ({mode === "pro" ? "Pro" : "Lite"})
          </p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            {isSimple
              ? "Your creative performance, explained in plain English. Switch to Advanced for the full statistical view."
              : isPro
              ? "Full statistical analysis across 120 creatives. Switch chart types in the variable explorer, sort the regression table by significance, and drill into variable interactions."
              : "Explore which creative variables correlate with better performance. Switch metrics, explore variables, and click creatives for detail."}
          </p>
        </div>
        {isPro && <ViewModeSwitcher />}
      </div>

      <MetricSwitcher metric={metric} onChange={setMetric} />

      <SummaryHeader
        keyMetrics={payload.keyMetrics}
        creativeCount={payload.creativeCount}
        regressionReady={payload.regressionReady}
        regressionThreshold={payload.regressionThreshold}
      />

      {isSimple && (
        <HeadsUpCard
          trustScore={payload.trustScore}
          variablePerformance={payload.variablePerformance}
          creativeCount={payload.creativeCount}
          regressionReady={payload.regressionReady}
          regressionThreshold={payload.regressionThreshold}
        />
      )}

      <div className="dashboard-trust-metrics mb-2">
        <TrustScorePanel
          trustScore={payload.trustScore}
          modelStability={modelStability}
          simplified={isSimple}
        />
        <KeyMetricsPanel
          keyMetrics={payload.keyMetrics}
          metric={metric}
          simplified={isSimple}
        />
      </div>

      <VariableExplorer
        varPerf={payload.variablePerformance}
        metric={metric}
        isPro={isPro}
        creativeData={data.creativeData}
        interactions={data.variableInteractions}
        simplified={isSimple}
      />

      {/* Pro-only AND not simplified: regression table */}
      {isPro && !isSimple && data.regressionModels && (
        <RegressionTable
          model={data.regressionModels[metric]}
          hypothesisVariables={hypothesisVars}
        />
      )}

      {/* Pro-only AND not simplified: interaction matrix */}
      {isPro && !isSimple && data.variableInteractions && (
        <InteractionMatrix
          interactions={data.variableInteractions}
          metric={metric}
        />
      )}

      {isSimple ? (
        <FindingCardsSimple
          varPerf={payload.variablePerformance}
          metric={metric}
        />
      ) : (
        <VariableTable
          varPerf={payload.variablePerformance}
          metric={metric}
          hypothesisVariables={hypothesisVars}
        />
      )}

      <CreativeGallery
        gallery={payload.gallery}
        metric={metric}
        creativeData={data.creativeData}
        simplified={isSimple}
      />

      {isSimple ? (
        <RecommendationsSimple insights={data.insights} />
      ) : (
        <InsightsPanel
          insights={data.insights}
          hypothesisVariables={hypothesisVars}
        />
      )}

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

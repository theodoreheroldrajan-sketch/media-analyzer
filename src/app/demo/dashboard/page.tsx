"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import type { MetricKey } from "@/lib/analytics";

import MetricSwitcher from "@/components/dashboard/metric-switcher";
import SummaryHeader from "@/components/dashboard/summary-header";
import TrustScorePanel from "@/components/dashboard/trust-score-panel";
import KeyMetricsPanel from "@/components/dashboard/key-metrics-panel";
import VariableExplorer from "@/components/dashboard/variable-explorer";
import VariableTable from "@/components/dashboard/variable-table";
import CreativeGallery from "@/components/dashboard/creative-gallery";
import InsightsPanel from "@/components/dashboard/insights-panel";

export default function DemoDashboardPage() {
  const { dashboards, insights, creativeData } = useDemo();
  const [metric, setMetric] = useState<MetricKey>("ctr");

  const data = dashboards[metric];

  return (
    <div className="page" style={{ maxWidth: "none" }}>
      <div className="page-head">
        <p className="page-eyebrow">Step 06 · Demo</p>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">
          Explore which creative variables correlate with better performance.
          Switch metrics, explore variables, and click creatives for detail.
        </p>
      </div>

      <MetricSwitcher metric={metric} onChange={setMetric} />

      <SummaryHeader
        keyMetrics={data.keyMetrics}
        creativeCount={data.creativeCount}
        regressionReady={data.regressionReady}
        regressionThreshold={data.regressionThreshold}
      />

      <div className="grid-2 mb-2">
        <TrustScorePanel trustScore={data.trustScore} />
        <KeyMetricsPanel keyMetrics={data.keyMetrics} metric={metric} />
      </div>

      <VariableExplorer varPerf={data.variablePerformance} metric={metric} />
      <VariableTable varPerf={data.variablePerformance} metric={metric} />
      <CreativeGallery
        gallery={data.gallery}
        metric={metric}
        creativeData={creativeData}
      />
      <InsightsPanel insights={insights} />

      <div className="page-actions">
        <Link href="/demo/analysis" className="btn">
          ← Back to analysis
        </Link>
        <div className="spacer" />
        <Link href="/demo" className="btn">
          Return to demo home
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useDemo, type DashboardView } from "@/context/demo-context";

const VIEWS: { key: DashboardView; label: string; sub: string }[] = [
  { key: "simple", label: "Simplified", sub: "Plain-English overview" },
  { key: "advanced", label: "Advanced", sub: "Full statistical detail" },
];

export default function ViewModeSwitcher() {
  const { viewMode, setViewMode } = useDemo();
  return (
    <div className="metric-pills view-mode-switcher">
      {VIEWS.map((v) => (
        <button
          key={v.key}
          className={`metric-pill ${viewMode === v.key ? "active" : ""}`}
          onClick={() => setViewMode(v.key)}
          title={v.sub}
        >
          <span className="metric-pill-label">{v.label}</span>
          <span className="metric-pill-sub">{v.sub}</span>
        </button>
      ))}
    </div>
  );
}

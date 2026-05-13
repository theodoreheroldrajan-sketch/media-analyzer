"use client";

import { useRouter } from "next/navigation";
import { useDemo } from "@/context/demo-context";

export default function DemoModeChooserPage() {
  const { setMode, isReady } = useDemo();
  const router = useRouter();

  function pick(mode: "lite" | "pro") {
    setMode(mode);
    router.push("/demo/setup");
  }

  if (!isReady) return null;

  return (
    <div className="page">
      <div className="page-head" style={{ textAlign: "center" }}>
        <p className="hero-eyebrow">interactive demo</p>
        <h1 className="page-title" style={{ fontSize: 32 }}>
          Pick a demo mode
        </h1>
        <p className="page-sub" style={{ maxWidth: 640, margin: "8px auto 0" }}>
          Both modes use the same fictional brand (GlowLab, a DTC skincare
          company). Pick the one that matches your dataset size and technical
          comfort level. You can come back and switch later.
        </p>
      </div>

      <div className="mode-cards-grid">
        {/* Lite card */}
        <button className="mode-card mode-card-lite" onClick={() => pick("lite")}>
          <div className="mode-card-eyebrow mono">Lite mode</div>
          <h3 className="mode-card-title">For smaller campaigns</h3>
          <p className="mode-card-sub">
            Social media managers, smaller ad sets, founders running their own
            ads. Sub-80 creatives.
          </p>

          <div className="mode-card-features">
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>40 sample creatives</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>Simple dashboard with key metrics</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>Bar chart visualisation</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>Trust score + variable performance table</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>5 plain-language insights</span>
            </div>
            <div className="mode-card-feature mode-card-feature-muted">
              <span className="mode-card-x">—</span>
              <span>No regression analysis</span>
            </div>
            <div className="mode-card-feature mode-card-feature-muted">
              <span className="mode-card-x">—</span>
              <span>No custom variables</span>
            </div>
          </div>

          <div className="mode-card-cta">
            Try Lite mode →
          </div>
        </button>

        {/* Pro card */}
        <button className="mode-card mode-card-pro" onClick={() => pick("pro")}>
          <div className="mode-card-eyebrow mono">Pro mode · recommended</div>
          <h3 className="mode-card-title">For data-driven teams</h3>
          <p className="mode-card-sub">
            Performance marketers, growth teams, agencies. Datasets of 80+
            creatives with substantial ad spend.
          </p>

          <div className="mode-card-features">
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span><strong>120 sample creatives</strong> across 6 campaigns</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>Full regression analysis with p-values, R², coefficients</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>5 chart types: bar, scatter, regression, distribution, heatmap</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>Variable interaction matrices</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>AI-suggested custom variables</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>Advanced mapping with confidence scores</span>
            </div>
            <div className="mode-card-feature">
              <span className="mode-card-check">✓</span>
              <span>Custom variable builder</span>
            </div>
          </div>

          <div className="mode-card-cta">
            Try Pro mode →
          </div>
        </button>
      </div>

    </div>
  );
}

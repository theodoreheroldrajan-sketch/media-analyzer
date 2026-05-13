"use client";

import Link from "next/link";
import { useDemo } from "@/context/demo-context";

export default function DemoHomePage() {
  const { project, creatives } = useDemo();

  return (
    <div className="page">
      <div className="hero">
        <p className="hero-eyebrow">demo · sample data</p>
        <h1>Explore the Creative Media Analyser</h1>
        <p>
          This is an interactive demo using sample data from a fictional DTC
          skincare brand. Click through each step to see how the tool works, or
          jump straight to the dashboard.
        </p>

        <div
          style={{
            padding: "16px 20px",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "var(--surface)",
            marginBottom: 24,
          }}
        >
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
            {project.name}
          </p>
          <p className="muted" style={{ margin: 0, fontSize: 12 }}>
            {project.brand_name} · {project.brand_category} ·{" "}
            {project.platform} · {creatives.length} creatives loaded
          </p>
        </div>

        <div className="flow-3step">
          <div className="flow-step">
            <p className="flow-step-num mono">01</p>
            <p className="flow-step-title">Upload</p>
            <p className="flow-step-sub">
              {creatives.length} creatives + performance CSV pre-loaded.
            </p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <p className="flow-step-num mono">02</p>
            <p className="flow-step-title">Analyse</p>
            <p className="flow-step-sub">
              AI extracted 22 variables per creative.
            </p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <p className="flow-step-num mono">03</p>
            <p className="flow-step-title">Learn</p>
            <p className="flow-step-sub">
              See which patterns drive performance.
            </p>
          </div>
        </div>

        <div className="hero-cta">
          <Link href="/demo/dashboard" className="btn btn-primary">
            Jump to dashboard →
          </Link>
          <Link href="/demo/setup" className="btn">
            Start from setup
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useProject } from "@/context/project-context";

export default function HomePage() {
  const { project, loading } = useProject();

  return (
    <div className="page">
      <div className="hero">
        <p className="hero-eyebrow">v1.0 · live</p>
        <h1>Find out which creative patterns actually drive performance.</h1>
        <p>
          Upload your ad creatives and a performance CSV. The analyser extracts
          structured creative variables — colour, hook, CTA, social proof,
          message angle — with AI, links each creative to its performance row,
          and shows you what patterns correlate with better CTR, CPC, CPA, CVR,
          or ROAS.
        </p>

        <div className="flow-3step">
          <div className="flow-step">
            <p className="flow-step-num mono">01</p>
            <p className="flow-step-title">Upload</p>
            <p className="flow-step-sub">
              Creatives + performance CSV. We match them automatically.
            </p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <p className="flow-step-num mono">02</p>
            <p className="flow-step-title">Analyse</p>
            <p className="flow-step-sub">
              AI extracts 30+ structured variables per image.
            </p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <p className="flow-step-num mono">03</p>
            <p className="flow-step-title">Learn</p>
            <p className="flow-step-sub">
              See which variables correlate with better performance.
            </p>
          </div>
        </div>

        <div className="hero-cta">
          {!loading && project ? (
            <>
              <Link href="/dashboard" className="btn btn-primary">
                Continue to dashboard →
              </Link>
              <Link href="/setup" className="btn">
                Edit project
              </Link>
            </>
          ) : (
            <Link href="/setup" className="btn btn-primary">
              Start new project →
            </Link>
          )}
        </div>

        {!loading && project && (
          <div
            style={{
              marginTop: 20,
              padding: "12px 16px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--bg-2)",
              fontSize: 13,
            }}
          >
            <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
              Active project: {project.name}
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              {project.brand_name} · {project.brand_category} · {project.platform}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

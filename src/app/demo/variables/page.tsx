"use client";

import Link from "next/link";
import { useState } from "react";
import { getDemoVariables } from "@/lib/demo-data";

export default function DemoVariablesPage() {
  const demoVars = getDemoVariables();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(demoVars.map((v) => [v.name, true]))
  );

  function toggle(name: string) {
    setEnabled((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const enabledCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 04 · Demo</p>
        <h1 className="page-title">Variables</h1>
        <p className="page-sub">
          These are the creative variables that AI will extract from each image.
          Toggle any variable on or off. {enabledCount} of {demoVars.length}{" "}
          enabled.
        </p>
      </div>

      <div className="panel">
        <div className="between">
          <h3 className="panel-title">Variable schema</h3>
          <span className="badge badge-accent">
            {enabledCount} enabled
          </span>
        </div>
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
            marginTop: 12,
          }}
        >
          {demoVars.map((v) => (
            <div className="var-row" key={v.name}>
              <input
                type="checkbox"
                checked={enabled[v.name]}
                onChange={() => toggle(v.name)}
              />
              <div>
                <span className="var-name">{v.name}</span>
              </div>
              <span className="var-allowed">
                {v.type === "boolean"
                  ? "true / false"
                  : v.type === "integer"
                    ? "0, 1, 2, 3..."
                    : v.values?.join(", ") ?? ""}
              </span>
              <span
                className="badge"
                style={{ fontSize: 10, justifySelf: "end" }}
              >
                {v.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="page-actions">
        <Link href="/demo/mapping" className="btn">
          ← Back to mapping
        </Link>
        <div className="spacer" />
        <Link href="/demo/analysis" className="btn btn-primary">
          Continue to analysis →
        </Link>
      </div>
    </div>
  );
}

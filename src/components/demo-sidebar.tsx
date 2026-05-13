"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "@/context/demo-context";

const steps = [
  { href: "/demo", label: "Mode", path: "/" },
  { href: "/demo/setup", label: "Setup", path: "/setup" },
  { href: "/demo/instructions", label: "Instructions", path: "/instructions" },
  { href: "/demo/upload", label: "Upload", path: "/upload" },
  { href: "/demo/mapping", label: "Mapping", path: "/mapping" },
  { href: "/demo/variables", label: "Variables", path: "/variables" },
  { href: "/demo/analysis", label: "Analysis", path: "/analysis" },
  { href: "/demo/dashboard", label: "Dashboard", path: "/dashboard" },
];

export default function DemoSidebar() {
  const pathname = usePathname();
  const { mode } = useDemo();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <p className="sidebar-brand">Creative Media Analyser</p>
        <p className="sidebar-project">
          Interactive Demo
          {mode && (
            <span
              className="badge mono"
              style={{
                marginLeft: 8,
                fontSize: 10,
                color: mode === "pro" ? "var(--accent-text)" : "var(--text-2)",
              }}
            >
              {mode.toUpperCase()}
            </span>
          )}
        </p>
        <p className="sidebar-project-meta">
          GlowLab · {mode === "pro" ? "120" : "40"} creatives
        </p>
      </div>
      <ul className="stepper">
        {steps.map((step, i) => {
          const isActive = step.href === pathname;
          const isDone = !isActive;

          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className={`step ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
              >
                <span className="step-num">
                  {isDone ? "✓" : String(i + 1).padStart(2, "0")}
                </span>
                <span className="step-label">{step.label}</span>
                <span className="step-path">{step.path}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

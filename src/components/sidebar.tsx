"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/context/project-context";

const steps = [
  { href: "/", label: "Home", path: "/" },
  { href: "/setup", label: "Setup", path: "/setup" },
  { href: "/instructions", label: "Instructions", path: "/instructions" },
  { href: "/upload", label: "Upload", path: "/upload" },
  { href: "/mapping", label: "Mapping", path: "/mapping" },
  { href: "/variables", label: "Variables", path: "/variables" },
  { href: "/analysis", label: "Analysis", path: "/analysis" },
  { href: "/dashboard", label: "Dashboard", path: "/dashboard" },
  { href: "/settings", label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { project } = useProject();
  const currentIndex = steps.findIndex((s) => s.href === pathname);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <p className="sidebar-brand">Creative Media Analyser</p>
        <p className="sidebar-project">{project?.name ?? "Untitled project"}</p>
        <p className="sidebar-project-meta">
          {project ? project.brand_name : "No brand set"}
        </p>
      </div>
      <ul className="stepper">
        {steps.map((step, i) => {
          const isActive = step.href === pathname;
          const isDone = currentIndex > i;

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

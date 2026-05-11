"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject } from "@/context/project-context";
import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

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

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const checkCompletion = useCallback(async () => {
    if (!project) {
      setCompletedSteps(new Set());
      return;
    }

    const done = new Set<string>();
    done.add("/"); // Home is always done

    try {
      const supabase = getSupabase();

      // Setup — project exists
      done.add("/setup");
      done.add("/instructions"); // Instructions is read-only

      // Upload — has creatives AND performance rows
      const [{ count: cCount }, { count: pCount }] = await Promise.all([
        supabase
          .from("creatives")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id),
        supabase
          .from("performance_rows")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .eq("is_latest", true),
      ]);

      if ((cCount ?? 0) > 0 && (pCount ?? 0) > 0) {
        done.add("/upload");
      }

      // Mapping — has confirmed mappings
      const { count: mapCount } = await supabase
        .from("creative_mappings")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("status", "confirmed");

      if ((mapCount ?? 0) > 0) {
        done.add("/mapping");
      }

      // Variables — has active schema
      const { data: schema } = await supabase
        .from("variable_schemas")
        .select("id")
        .eq("project_id", project.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (schema) {
        done.add("/variables");
      }

      // Analysis — has completed run
      const { data: run } = await supabase
        .from("analysis_runs")
        .select("id")
        .eq("project_id", project.id)
        .eq("status", "completed")
        .limit(1)
        .maybeSingle();

      if (run) {
        done.add("/analysis");
        done.add("/dashboard"); // Dashboard available once analysis is done
      }
    } catch {
      // Silent fail — sidebar still works
    }

    setCompletedSteps(done);
  }, [project]);

  useEffect(() => {
    checkCompletion();
  }, [checkCompletion, pathname]); // Re-check on navigation

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <p className="sidebar-brand">Creative Media Analyser</p>
        <p className="sidebar-project">{project?.name ?? "No project"}</p>
        {project && (
          <p className="sidebar-project-meta">
            {project.brand_name}
          </p>
        )}
      </div>
      <ul className="stepper">
        {steps.map((step, i) => {
          const isActive = step.href === pathname;
          const isDone = completedSteps.has(step.href) && !isActive;

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

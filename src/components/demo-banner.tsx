"use client";

import { useDemo } from "@/context/demo-context";
import Link from "next/link";

export default function DemoBanner() {
  const { mode } = useDemo();

  if (!mode) {
    return (
      <div className="demo-banner">
        <span>⚠️</span>
        <span>
          <strong>No mode selected.</strong>{" "}
          <Link href="/demo">Pick Pro or Lite to begin →</Link>
        </span>
      </div>
    );
  }

  return (
    <div className="demo-banner">
      <span>📊</span>
      <span>
        <strong>{mode === "pro" ? "Pro" : "Lite"} mode demo</strong> — exploring
        sample data for GlowLab, a fictional DTC skincare brand. All fields are
        editable, nothing is saved.
      </span>
    </div>
  );
}

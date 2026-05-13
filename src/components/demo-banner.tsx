"use client";

import { useState } from "react";
import { useDemo } from "@/context/demo-context";
import Link from "next/link";

export default function DemoBanner() {
  const { mode } = useDemo();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  if (!mode) {
    return (
      <div className="demo-banner">
        <span>⚠️</span>
        <span>
          <strong>No mode selected.</strong>{" "}
          <Link href="/demo">Pick Pro or Lite to begin →</Link>
        </span>
        <button
          className="demo-banner-dismiss"
          onClick={() => setVisible(false)}
          aria-label="Dismiss banner"
        >
          ✕
        </button>
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
      <button
        className="demo-banner-dismiss"
        onClick={() => setVisible(false)}
        aria-label="Dismiss banner"
      >
        ✕
      </button>
    </div>
  );
}

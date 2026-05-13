"use client";

import Link from "next/link";
import DemoModeGuard from "@/components/demo-mode-guard";
import InstructionsContent from "@/components/instructions-content";

function InstructionsPageContent() {
  return (
    <div className="page" style={{ maxWidth: "none" }}>
      <InstructionsContent />

      <div className="page-actions">
        <Link href="/demo/setup" className="btn">
          ← Back to setup
        </Link>
        <div className="spacer" />
        <Link href="/demo/upload" className="btn btn-primary">
          Continue to upload →
        </Link>
      </div>
    </div>
  );
}

export default function DemoInstructionsPage() {
  return (
    <DemoModeGuard>
      <InstructionsPageContent />
    </DemoModeGuard>
  );
}

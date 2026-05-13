"use client";

import { usePathname } from "next/navigation";
import { DemoProvider } from "@/context/demo-context";
import DemoSidebar from "@/components/demo-sidebar";
import DemoBanner from "@/components/demo-banner";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <DemoShell>{children}</DemoShell>
    </DemoProvider>
  );
}

function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/demo";

  // On the landing page, don't show the sidebar — let user pick mode first
  if (isLanding) {
    return (
      <div className="app">
        <div className="main" style={{ width: "100%" }}>
          <div
            className="topbar"
            style={{ justifyContent: "space-between" }}
          >
            <div className="crumbs">
              <strong>Demo Mode</strong>
              <span className="sep">·</span>
              Pick a mode to begin
            </div>
            <a href="/" className="btn btn-sm">
              ← Exit demo
            </a>
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <DemoSidebar />
      <div className="main">
        <div
          className="topbar"
          style={{ justifyContent: "space-between" }}
        >
          <div className="crumbs">
            <strong>Demo Mode</strong>
            <span className="sep">·</span>
            Sample data — no API calls
          </div>
          <a href="/demo" className="btn btn-sm">
            ← Change mode
          </a>
        </div>
        <DemoBanner />
        {children}
      </div>
    </div>
  );
}

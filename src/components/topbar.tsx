"use client";

import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  "/": "Home",
  "/setup": "Setup",
  "/instructions": "Instructions",
  "/upload": "Upload",
  "/mapping": "Mapping",
  "/variables": "Variables",
  "/analysis": "Analysis",
  "/dashboard": "Dashboard",
  "/settings": "Settings",
};

export default function TopBar() {
  const pathname = usePathname();
  const label = labels[pathname] || "Page";

  return (
    <div className="topbar">
      <div className="crumbs">
        <span>analyser</span>
        <span className="sep">/</span>
        <span className="mono">{pathname}</span>
        <span className="sep">/</span>
        <strong>{label}</strong>
      </div>
      <div className="topbar-right">
        <button className="btn btn-sm">Help</button>
      </div>
    </div>
  );
}

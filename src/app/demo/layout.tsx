import { DemoProvider } from "@/context/demo-context";
import DemoSidebar from "@/components/demo-sidebar";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
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
            <a href="/" className="btn btn-sm">
              ← Exit demo
            </a>
          </div>
          <div className="demo-banner">
            <span>📊</span>
            <span>
              <strong>Interactive demo</strong> — exploring sample data for a
              fictional DTC skincare brand. All fields are editable, nothing is
              saved.
            </span>
          </div>
          {children}
        </div>
      </div>
    </DemoProvider>
  );
}

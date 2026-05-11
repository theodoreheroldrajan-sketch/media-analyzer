import type { Metadata } from "next";
import "./globals.css";
import { ProjectProvider } from "@/context/project-context";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";

export const metadata: Metadata = {
  title: "Creative Media Analyser",
  description:
    "Upload ad creatives and performance data, extract creative variables, and discover what patterns correlate with better performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ProjectProvider>
          <div className="app">
            <Sidebar />
            <div className="main">
              <TopBar />
              {children}
            </div>
          </div>
        </ProjectProvider>
      </body>
    </html>
  );
}

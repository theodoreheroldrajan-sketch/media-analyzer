import type { Metadata } from "next";
import "./globals.css";
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
        <div className="app">
          <Sidebar />
          <div className="main">
            <TopBar />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}

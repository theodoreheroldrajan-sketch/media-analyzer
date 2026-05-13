import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}

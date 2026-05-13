"use client";

import { createContext, useContext, useMemo } from "react";
import { generateDemoData, type DemoDataSet } from "@/lib/demo-data";

const DemoContext = createContext<DemoDataSet | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const data = useMemo(() => generateDemoData(), []);

  return (
    <DemoContext.Provider value={data}>{children}</DemoContext.Provider>
  );
}

export function useDemo(): DemoDataSet {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

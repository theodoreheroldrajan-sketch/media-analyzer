"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateDemoData, type DemoDataSet, type DemoMode } from "@/lib/demo-data";

type DemoContextValue = {
  mode: DemoMode | null;
  data: DemoDataSet | null;
  setMode: (m: DemoMode) => void;
  clearMode: () => void;
  isReady: boolean;
};

const DemoContext = createContext<DemoContextValue | null>(null);

const STORAGE_KEY = "media-analyzer-demo-mode";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DemoMode | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load mode from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "pro" || stored === "lite") {
      setModeState(stored);
    }
    setIsReady(true);
  }, []);

  function setMode(m: DemoMode) {
    setModeState(m);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, m);
    }
  }

  function clearMode() {
    setModeState(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const data = useMemo(() => (mode ? generateDemoData(mode) : null), [mode]);

  return (
    <DemoContext.Provider value={{ mode, data, setMode, clearMode, isReady }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoProvider");
  return ctx;
}

/** Helper for pages that REQUIRE a dataset (assumes mode is set) */
export function useDemoData(): DemoDataSet {
  const { data } = useDemo();
  if (!data) {
    throw new Error("Demo data not available — mode not set. This page should redirect to /demo.");
  }
  return data;
}

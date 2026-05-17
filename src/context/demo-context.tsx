"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { generateDemoData, type DemoDataSet, type DemoMode } from "@/lib/demo-data";

export type DashboardView = "simple" | "advanced";

type DemoContextValue = {
  mode: DemoMode | null;
  data: DemoDataSet | null;
  setMode: (m: DemoMode) => void;
  clearMode: () => void;
  viewMode: DashboardView;
  setViewMode: (v: DashboardView) => void;
  isReady: boolean;
};

const DemoContext = createContext<DemoContextValue | null>(null);

const STORAGE_KEY = "media-analyzer-demo-mode";
const VIEW_STORAGE_KEY = "media-analyzer-demo-view";

// External store subscription — fires when any localStorage write happens
// in another tab. Calls notify() when the in-tab writer (setMode/clearMode/setViewMode)
// dispatches a synthetic storage event for the current tab.
const storageListeners = new Set<() => void>();

function subscribeToDemoMode(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  storageListeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === VIEW_STORAGE_KEY || e.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    storageListeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function notifyDemoModeChanged() {
  storageListeners.forEach((cb) => cb());
}

function getStoredMode(): DemoMode | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "pro" || raw === "lite" ? raw : null;
}

function getServerMode(): DemoMode | null {
  return null;
}

function getStoredView(): DashboardView {
  if (typeof window === "undefined") return "simple";
  const raw = window.localStorage.getItem(VIEW_STORAGE_KEY);
  return raw === "advanced" ? "advanced" : "simple";
}

function getServerView(): DashboardView {
  return "simple";
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  // React 19: use useSyncExternalStore instead of useEffect+setState for
  // external store subscriptions. This avoids the cascading-render warning
  // and is the React-recommended pattern for hydrating from localStorage.
  const mode = useSyncExternalStore(
    subscribeToDemoMode,
    getStoredMode,
    getServerMode
  );

  const viewMode = useSyncExternalStore(
    subscribeToDemoMode,
    getStoredView,
    getServerView
  );

  // isReady mirrors the "is the client hydrated yet?" flag the old effect
  // computed. With useSyncExternalStore, server-snapshot returns null and
  // client-snapshot returns the real value — so once mode is read on the
  // client, the store has caught up.
  const isReady = useSyncExternalStore(
    subscribeToDemoMode,
    () => true,
    () => false
  );

  const setMode = useCallback((m: DemoMode) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, m);
    notifyDemoModeChanged();
  }, []);

  const clearMode = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    notifyDemoModeChanged();
  }, []);

  const setViewMode = useCallback((v: DashboardView) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, v);
    notifyDemoModeChanged();
  }, []);

  const data = useMemo(() => (mode ? generateDemoData(mode) : null), [mode]);

  return (
    <DemoContext.Provider value={{ mode, data, setMode, clearMode, viewMode, setViewMode, isReady }}>
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

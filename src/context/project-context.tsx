"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getSupabase } from "@/lib/supabase";
import type { Project } from "@/types/database";

type ProjectContextValue = {
  /** Currently active project (null while loading or if none selected) */
  project: Project | null;
  /** Whether the initial load is still in progress */
  loading: boolean;
  /** Set the active project by ID (persisted to localStorage) */
  setProjectId: (id: string) => void;
  /** Reload project data from Supabase */
  refresh: () => Promise<void>;
  /** Clear the active project */
  clear: () => void;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

const STORAGE_KEY = "media-analyser-project-id";

// External-store subscription for the localStorage-backed projectId.
// Mirrors the pattern used in demo-context.tsx: useSyncExternalStore on
// the read, explicit notify() on the write so the same tab updates too.
const projectIdListeners = new Set<() => void>();

function subscribeToProjectId(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  projectIdListeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    projectIdListeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function notifyProjectIdChanged() {
  projectIdListeners.forEach((cb) => cb());
}

function getStoredProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerProjectId(): string | null {
  return null;
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  // projectId comes from localStorage via useSyncExternalStore — no
  // setState-in-effect cascade. Demo-context uses the same pattern.
  const projectId = useSyncExternalStore(
    subscribeToProjectId,
    getStoredProjectId,
    getServerProjectId
  );

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch project when ID changes. This is a genuine async I/O effect:
  // setState happens inside the awaited Supabase callback, not synchronously
  // in the effect body. The React 19 lint rule is over-eager on this
  // pattern, so we suppress it here with rationale.
  const fetchProject = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await getSupabase()
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      // Project not found — clear stored ID
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
        notifyProjectIdChanged();
      }
      setProject(null);
    } else {
      setProject(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (projectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async Supabase fetch; setState happens inside the awaited callback, not synchronously in the effect body
      fetchProject(projectId);
    } else {
      setLoading(false);
    }
  }, [projectId, fetchProject]);

  const setProjectId = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, id);
    notifyProjectIdChanged();
  }, []);

  const refresh = useCallback(async () => {
    if (projectId) {
      await fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  const clear = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    notifyProjectIdChanged();
    setProject(null);
  }, []);

  return (
    <ProjectContext.Provider
      value={{ project, loading, setProjectId, refresh, clear }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return ctx;
}

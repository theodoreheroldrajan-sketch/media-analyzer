"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
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

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectIdState] = useState<string | null>(null);

  // Load project ID from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setProjectIdState(stored);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch project when ID changes
  const fetchProject = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      // Project not found — clear stored ID
      localStorage.removeItem(STORAGE_KEY);
      setProject(null);
      setProjectIdState(null);
    } else {
      setProject(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  const setProjectId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setProjectIdState(id);
  }, []);

  const refresh = useCallback(async () => {
    if (projectId) {
      await fetchProject(projectId);
    }
  }, [projectId, fetchProject]);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProject(null);
    setProjectIdState(null);
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

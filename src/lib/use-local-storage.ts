"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Read a JSON-serialised value from localStorage with `useSyncExternalStore`.
 *
 * Returns the parsed value (or `defaultValue` if absent / unparseable / SSR).
 * Subscribes to cross-tab `storage` events so a write in another tab is seen.
 *
 * This pattern is the React 19 recommended way to "hydrate state from
 * localStorage on mount" without running afoul of the
 * `react-hooks/set-state-in-effect` rule. The previous `useEffect` +
 * `setState` pattern triggers a cascading render that this avoids.
 *
 * @param key      The localStorage key to read.
 * @param defaultValue The value returned when the key is absent or unparseable.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): T {
  const getSnapshot = useCallback((): T => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback((): T => defaultValue, [defaultValue]);

  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);
}

/**
 * Read a raw string value from localStorage. Useful when the stored value
 * isn't JSON (e.g. the demo mode string).
 */
export function useLocalStorageString(
  key: string,
  defaultValue: string | null
): string | null {
  const getSnapshot = useCallback((): string | null => {
    if (typeof window === "undefined") return defaultValue;
    return window.localStorage.getItem(key) ?? defaultValue;
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(
    (): string | null => defaultValue,
    [defaultValue]
  );

  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);
}

function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

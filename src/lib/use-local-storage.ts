"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * Read a JSON-serialised value from localStorage via `useSyncExternalStore`.
 *
 * Returns the parsed value (or `defaultValue` if absent / unparseable / SSR /
 * storage-blocked). Subscribes to cross-tab `storage` events so a write in
 * another tab is observed.
 *
 * **Snapshot stability** — `useSyncExternalStore` requires that consecutive
 * calls to `getSnapshot()` return the same reference when the underlying
 * external value hasn't changed. Two things make this non-trivial here:
 *
 *  1. Inline `defaultValue` literals (`useLocalStorage<T>(key, [])`) create a
 *     new reference every render. We stabilise via `useRef`.
 *  2. `JSON.parse(raw)` returns a new object every call. We cache the parsed
 *     value per-key in a module-level Map keyed by the raw string; only
 *     re-parse when the raw string changes.
 *
 * Both fixes are required. Either alone produces an infinite render loop in
 * production — tolerated at top-level (renderer eventually gives up) but
 * fatal in iframes which have a tighter render budget. See the iframe
 * dashboard crash investigated and fixed in this commit.
 *
 * @param key          The localStorage key to read.
 * @param defaultValue Fallback when the key is absent, unparseable, or storage
 *                     is unavailable. Stabilised via useRef so call-site
 *                     literals are safe.
 */
export function useLocalStorage<T>(key: string, defaultValue: T): T {
  // Stabilise the default value across renders so inline literals at the
  // call site (e.g. `useLocalStorage<string[]>(KEY, [])`) don't churn.
  const defaultRef = useRef(defaultValue);

  const getSnapshot = useCallback((): T => {
    return readCachedSnapshot<T>(key, defaultRef.current);
  }, [key]);

  const getServerSnapshot = useCallback((): T => defaultRef.current, []);

  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);
}

/**
 * Read a raw string value from localStorage. Useful when the stored value
 * isn't JSON (e.g. a single mode string). Strings are primitives, so
 * `Object.is(a, b)` does the right thing without caching.
 */
export function useLocalStorageString(
  key: string,
  defaultValue: string | null
): string | null {
  const defaultRef = useRef(defaultValue);

  const getSnapshot = useCallback((): string | null => {
    if (typeof window === "undefined") return defaultRef.current;
    try {
      return window.localStorage.getItem(key) ?? defaultRef.current;
    } catch {
      return defaultRef.current;
    }
  }, [key]);

  const getServerSnapshot = useCallback(
    (): string | null => defaultRef.current,
    []
  );

  return useSyncExternalStore(subscribeToStorage, getSnapshot, getServerSnapshot);
}

// ─── Internal: parsed-snapshot cache ───────────────────────────────
//
// Module-level Map keyed by localStorage key. Each entry remembers the last
// `raw` string read from storage and the parsed value derived from it. While
// `raw` doesn't change, the same parsed value reference is returned, which
// satisfies `useSyncExternalStore`'s snapshot-stability contract.
//
// Cache is invalidated on the next `getSnapshot` call when the raw string
// differs — typically because a writer in this tab dispatched a synthetic
// `storage` event, or another tab wrote and the browser fired one for us.

type CacheEntry = { raw: string | null; parsed: unknown };
const snapshotCache = new Map<string, CacheEntry>();

function readCachedSnapshot<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // Iframe storage-blocked, privacy mode, quota error, etc.
    return defaultValue;
  }

  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) {
    return cached.parsed as T;
  }

  let parsed: T;
  if (raw === null) {
    parsed = defaultValue;
  } else {
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      parsed = defaultValue;
    }
  }

  snapshotCache.set(key, { raw, parsed });
  return parsed;
}

function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

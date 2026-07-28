"use client";

import { useEffect, useState } from "react";

/**
 * Demo persistence: mirrors a piece of state to localStorage so questionnaire
 * responses, submissions, and scheduling survive a page reload during UAT.
 *
 * This is interim, per-browser storage. The production build replaces it with
 * authenticated server persistence (database + server actions).
 *
 * First render (server and initial client) uses `initial` to avoid hydration
 * mismatch; the stored value is loaded in an effect immediately after mount.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore malformed / unavailable storage */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota / unavailable storage */
    }
  }, [key, state, hydrated]);

  return [state, setState];
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { loadJson, saveJson } from '@/lib/storage';

/**
 * State that is saved to AsyncStorage and read back on the next launch. `restore` checks
 * the saved value and returns null to ignore it (missing, corrupt or out of date), and
 * must be a stable function (e.g. defined at module level).
 *
 * The saved value replaces the initial state once loaded, unless the user has already
 * changed it. Nothing is written until then, so a fresh state never overwrites a saved one.
 */
export function usePersistedState<T>(
  key: string,
  initial: () => T,
  restore: (saved: unknown) => T | null,
): [T, (update: (current: T) => T) => void] {
  const [state, setState] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const changed = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadJson<unknown>(key).then((saved) => {
      if (cancelled) return;
      const restored = restore(saved);
      if (restored && !changed.current) setState(restored);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key, restore]);

  useEffect(() => {
    if (!loaded) return;
    saveJson(key, state).catch((error: unknown) => console.warn(`Could not save "${key}"`, error));
  }, [key, loaded, state]);

  const update = useCallback((next: (current: T) => T) => {
    changed.current = true;
    setState(next);
  }, []);

  return [state, update];
}

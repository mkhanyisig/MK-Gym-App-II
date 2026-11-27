import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useSyncExternalStore } from 'react';

import * as repo from '@/db/weightEntries';
import type { WeightEntry } from '@/lib/weight';

/** How many recent weigh-ins the shared state keeps; enough for history and a change. */
export const RECENT_LIMIT = 30;

export type WeightState = {
  /** Newest day first. */
  entries: WeightEntry[];
  /** A read is in progress. */
  loading: boolean;
  /** At least one read has succeeded for the current database. */
  loaded: boolean;
  /** The last read failure; cleared by the next successful read. Write errors reject instead. */
  error: Error | null;
};

const initialState: WeightState = { entries: [], loading: false, loaded: false, error: null };

/**
 * One shared copy of the recent weigh-ins, like `useProfile`: every screen sees the same
 * list, and a write anywhere updates them all. Created by a factory so tests get a
 * fresh, isolated store.
 */
export function createWeightStore() {
  let state = initialState;
  const listeners = new Set<() => void>();
  let db: repo.WeightDb | null = null;
  let inflight: Promise<void> | null = null;
  // Each read gets a number; only the latest read may update state, so a slow, stale
  // read can't overwrite fresher data.
  let readSeq = 0;
  // Writes run one at a time, in the order they were requested.
  let writeQueue: Promise<unknown> = Promise.resolve();

  function setState(patch: Partial<WeightState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  /** Reads the recent entries. Never rejects: failures land in `state.error`. */
  function read(): Promise<void> {
    const source = db;
    if (!source) return Promise.resolve();
    const seq = ++readSeq;
    setState({ loading: true });
    const run = repo.listRecent(source, RECENT_LIMIT).then(
      (entries) => {
        if (seq === readSeq && source === db)
          setState({ entries, loading: false, loaded: true, error: null });
      },
      (error: unknown) => {
        // Keep the last good entries; a transient failure shouldn't blank the screen.
        if (seq === readSeq && source === db) {
          setState({ loading: false, error: error instanceof Error ? error : new Error(String(error)) });
        }
      },
    );
    inflight = run.finally(() => {
      if (seq === readSeq) inflight = null;
    });
    return inflight;
  }

  /** Loads once per database. Safe to call from every mounting screen. */
  function ensureLoaded(nextDb: repo.WeightDb): Promise<void> {
    if (nextDb !== db) {
      // First use, or the database was reopened (e.g. after "Try again").
      db = nextDb;
      setState({ loaded: false, error: null });
      return read();
    }
    if (inflight) return inflight;
    if (state.loaded) return Promise.resolve();
    return read();
  }

  /**
   * Queues a write, then re-reads so every screen sees what SQLite saved. Resolves with
   * the write's result only after both; rejects if the write fails (state unchanged).
   */
  function write<T>(op: (target: repo.WeightDb) => Promise<T>): Promise<T> {
    const run = writeQueue.then(async () => {
      if (!db) throw new Error('The weight store has no database yet');
      const result = await op(db);
      await read();
      return result;
    });
    writeQueue = run.catch(() => undefined); // a failed write mustn't block later ones
    return run;
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    ensureLoaded,
    refresh: read,
    logWeight: (date: string, weightKg: number) =>
      write((target) => repo.upsertForDay(target, date, weightKg)),
    updateWeight: (id: number, changes: { date?: string; weightKg?: number }) =>
      write((target) => repo.update(target, id, changes)),
    deleteWeight: (id: number) => write((target) => repo.remove(target, id)),
  };
}

export type WeightStore = ReturnType<typeof createWeightStore>;

const store = createWeightStore();

/**
 * Recent weigh-ins plus actions to change them. Must be used below DatabaseProvider.
 * `latest` and `previous` are the two most recent entries (null when missing).
 */
export function useWeightEntries() {
  const db = useSQLiteContext();
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    void store.ensureLoaded(db);
  }, [db]);

  return {
    entries: state.entries,
    latest: state.entries[0] ?? null,
    previous: state.entries[1] ?? null,
    // Still loading until the first read finishes or fails.
    loading: state.loading || (!state.loaded && !state.error),
    /** The first read has succeeded, so an empty `entries` really means "none yet". */
    loaded: state.loaded,
    error: state.error,
    refresh: store.refresh,
    logWeight: store.logWeight,
    updateWeight: store.updateWeight,
    deleteWeight: store.deleteWeight,
  };
}

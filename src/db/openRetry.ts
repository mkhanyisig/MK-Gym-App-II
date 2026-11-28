/**
 * On web, SQLite keeps the database in the browser's private file storage, where only one
 * connection at a time may hold the file. A second tab, or a reload before the previous
 * page has let go, fails to open with this error. The lock is usually released within a
 * second or two, so opening is retried a few times before giving up.
 */
export function isDatabaseLockedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Access Handles? cannot be created|NoModificationAllowedError|createSyncAccessHandle/i.test(message);
}

/** Waits before each automatic retry: 250 ms doubling to 4 s, about 8 s in total. */
export const LOCK_RETRY_DELAYS_MS = [250, 500, 1_000, 2_000, 4_000];

/** The wait before automatic retry number `retry` (0-based), or null when it's time to give up. */
export function lockRetryDelay(retry: number): number | null {
  return LOCK_RETRY_DELAYS_MS[retry] ?? null;
}

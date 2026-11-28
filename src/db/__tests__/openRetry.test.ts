import { isDatabaseLockedError, LOCK_RETRY_DELAYS_MS, lockRetryDelay } from '@/db/openRetry';

describe('isDatabaseLockedError', () => {
  it('recognizes the web file-lock error', () => {
    const error = new Error(
      "Failed to execute 'createSyncAccessHandle' on 'FileSystemFileHandle': Access Handles cannot be created if there is another open Access Handle or Writable stream associated with the same file.",
    );
    expect(isDatabaseLockedError(error)).toBe(true);
    expect(isDatabaseLockedError('NoModificationAllowedError: locked')).toBe(true);
  });

  it('ignores other failures, which should surface straight away', () => {
    expect(isDatabaseLockedError(new Error('This database is from a newer version of My Form.'))).toBe(false);
    expect(isDatabaseLockedError(new Error('disk I/O error'))).toBe(false);
    expect(isDatabaseLockedError(null)).toBe(false);
  });
});

describe('lockRetryDelay', () => {
  it('backs off, then gives up', () => {
    expect(LOCK_RETRY_DELAYS_MS.map((_, i) => lockRetryDelay(i))).toEqual([250, 500, 1_000, 2_000, 4_000]);
    expect(lockRetryDelay(LOCK_RETRY_DELAYS_MS.length)).toBeNull();
  });
});

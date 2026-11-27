import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded, SCHEMA_VERSION } from '@/db/database';

/**
 * A minimal stand-in for the few SQLiteDatabase methods migrations use. It tracks
 * `PRAGMA user_version` and records executed SQL, so we can test the versioning logic
 * without a real SQLite engine (which Jest can't load). The SQL itself is verified in
 * the running app.
 */
function fakeDb(startVersion: number, { failOn }: { failOn?: string } = {}) {
  let userVersion = startVersion;
  const executed: string[] = [];
  let transactions = 0;

  const db = {
    getFirstAsync: async () => ({ user_version: userVersion }),
    execAsync: async (sql: string) => {
      if (failOn && sql.includes(failOn)) throw new Error(`boom: ${failOn}`);
      const pragma = /PRAGMA user_version = (\d+)/.exec(sql);
      if (pragma) userVersion = Number(pragma[1]);
      else executed.push(sql.replace(/\s+/g, ' ').trim());
    },
    withTransactionAsync: async (task: () => Promise<void>) => {
      transactions += 1;
      const before = userVersion;
      try {
        await task();
      } catch (e) {
        userVersion = before; // a failed transaction rolls back its version bump
        throw e;
      }
    },
  };

  return {
    db: db as unknown as SQLiteDatabase,
    version: () => userVersion,
    executed,
    transactions: () => transactions,
  };
}

describe('migrateDbIfNeeded', () => {
  it('creates the schema on a fresh database and records the version', async () => {
    const fake = fakeDb(0);
    await migrateDbIfNeeded(fake.db);

    expect(SCHEMA_VERSION).toBe(1);
    expect(fake.version()).toBe(1);
    expect(fake.executed).toHaveLength(1);
    expect(fake.executed[0]).toContain('CREATE TABLE IF NOT EXISTS weight_entries');
    expect(fake.executed[0]).toContain('date TEXT NOT NULL UNIQUE');
    expect(fake.executed[0]).toContain('CHECK (weight_kg > 0)');
  });

  it('runs each migration inside a transaction', async () => {
    const fake = fakeDb(0);
    await migrateDbIfNeeded(fake.db);
    expect(fake.transactions()).toBe(SCHEMA_VERSION);
  });

  it('does nothing when the database is already current (safe to run every launch)', async () => {
    const fake = fakeDb(SCHEMA_VERSION);
    await migrateDbIfNeeded(fake.db);
    await migrateDbIfNeeded(fake.db);

    expect(fake.executed).toHaveLength(0);
    expect(fake.transactions()).toBe(0);
    expect(fake.version()).toBe(SCHEMA_VERSION);
  });

  it('refuses a database from a newer app version instead of touching it', async () => {
    const fake = fakeDb(SCHEMA_VERSION + 1);
    await expect(migrateDbIfNeeded(fake.db)).rejects.toThrow(/newer than this app supports/);
    expect(fake.executed).toHaveLength(0);
  });

  it('surfaces a failed migration and leaves the version unchanged', async () => {
    const fake = fakeDb(0, { failOn: 'CREATE TABLE' });
    await expect(migrateDbIfNeeded(fake.db)).rejects.toThrow('boom');
    expect(fake.version()).toBe(0);
  });
});

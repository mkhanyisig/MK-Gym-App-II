import type { SQLiteDatabase } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/database';

/**
 * Test-only: a real in-memory SQLite (Node's built-in `node:sqlite`) behind the same
 * async methods the app uses from expo-sqlite, so repository tests run real SQL,
 * constraints and transactions without a device. Never imported by the app.
 */

type Params = (string | number | null)[];

type NodeStatement = {
  all(...params: Params): Record<string, unknown>[];
  get(...params: Params): Record<string, unknown> | undefined;
  run(...params: Params): { changes: number | bigint; lastInsertRowid: number | bigint };
};
type NodeDatabase = { exec(sql: string): void; prepare(sql: string): NodeStatement; close(): void };

export type TestDb = SQLiteDatabase & {
  /** Make the next read (`getAllAsync`) fail, to test error handling. */
  failNextRead(error?: Error): void;
  /** How many times `getAllAsync` has run. */
  readCount(): number;
};

/** A fresh in-memory database, migrated to the current schema. */
export async function createTestDb(): Promise<TestDb> {
  const { DatabaseSync } = jest.requireActual<{ DatabaseSync: new (path: string) => NodeDatabase }>(
    'node:sqlite',
  );
  const raw = new DatabaseSync(':memory:');
  let pendingReadError: Error | null = null;
  let reads = 0;

  const db = {
    execAsync: async (sql: string) => {
      raw.exec(sql);
    },
    getAllAsync: async (sql: string, params: Params = []) => {
      reads += 1;
      if (pendingReadError) {
        const error = pendingReadError;
        pendingReadError = null;
        throw error;
      }
      return raw.prepare(sql).all(...params);
    },
    getFirstAsync: async (sql: string, params: Params = []) => raw.prepare(sql).get(...params) ?? null,
    runAsync: async (sql: string, params: Params = []) => {
      const result = raw.prepare(sql).run(...params);
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    withTransactionAsync: async (task: () => Promise<void>) => {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
    failNextRead: (error = new Error('simulated read failure')) => {
      pendingReadError = error;
    },
    readCount: () => reads,
  };

  const testDb = db as unknown as TestDb;
  await migrateDbIfNeeded(testDb);
  return testDb;
}

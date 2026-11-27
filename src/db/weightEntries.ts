import type { SQLiteDatabase } from 'expo-sqlite';

import { isDayKey, isValidWeightKg, type WeightEntry } from '@/lib/weight';

/**
 * All SQL for the `weight_entries` table lives here; screens and hooks call these
 * functions instead of writing queries.
 *
 * Each function takes the database as its first argument (from `useSQLiteContext()`
 * in the app), which keeps them easy to test against a real in-memory SQLite.
 * Errors are thrown, never turned into empty results.
 */

/** The subset of expo-sqlite's database this module uses. */
export type WeightDb = Pick<
  SQLiteDatabase,
  'getAllAsync' | 'getFirstAsync' | 'runAsync' | 'withTransactionAsync'
>;

export type WeightEntryErrorCode =
  | 'invalid-date'
  | 'invalid-weight'
  | 'invalid-id'
  | 'invalid-limit'
  | 'no-changes'
  | 'not-found'
  | 'duplicate-date';

/** A rejected input or missing row. Database failures are thrown as SQLite's own errors. */
export class WeightEntryError extends Error {
  readonly code: WeightEntryErrorCode;

  constructor(code: WeightEntryErrorCode, message: string) {
    super(message);
    this.name = 'WeightEntryError';
    this.code = code;
  }
}

type Row = { id: number; date: string; weight_kg: number; created_at: string; updated_at: string };

const COLUMNS = 'id, date, weight_kg, created_at, updated_at';

const toEntry = (row: Row): WeightEntry => ({
  id: row.id,
  date: row.date,
  weightKg: row.weight_kg,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const nowIso = () => new Date().toISOString();

function assertDate(date: string) {
  if (!isDayKey(date)) throw new WeightEntryError('invalid-date', `Not a valid day (YYYY-MM-DD): "${date}"`);
}

function assertWeight(weightKg: number) {
  if (!isValidWeightKg(weightKg)) {
    throw new WeightEntryError('invalid-weight', `Weight must be a positive number of kg, got ${weightKg}`);
  }
}

function assertId(id: number) {
  if (!Number.isInteger(id) || id <= 0)
    throw new WeightEntryError('invalid-id', `Not a valid entry id: ${id}`);
}

/** The most recent weigh-ins, newest day first. */
export async function listRecent(db: WeightDb, limit: number): Promise<WeightEntry[]> {
  if (!Number.isInteger(limit) || limit <= 0) {
    throw new WeightEntryError('invalid-limit', `Limit must be a positive integer, got ${limit}`);
  }
  const rows = await db.getAllAsync<Row>(`SELECT ${COLUMNS} FROM weight_entries ORDER BY date DESC LIMIT ?`, [
    limit,
  ]);
  return rows.map(toEntry);
}

/** The two most recent weigh-ins (newest first); fewer if there aren't two yet. */
export function latestTwo(db: WeightDb): Promise<WeightEntry[]> {
  return listRecent(db, 2);
}

/** The weigh-in for a local day, or null if there isn't one. */
export async function getByDate(db: WeightDb, date: string): Promise<WeightEntry | null> {
  assertDate(date);
  const row = await db.getFirstAsync<Row>(`SELECT ${COLUMNS} FROM weight_entries WHERE date = ?`, [date]);
  return row ? toEntry(row) : null;
}

/**
 * Records the weight for a day, replacing that day's value if it already has one (the
 * UI confirms before replacing). One atomic statement: the UNIQUE(date) conflict turns
 * the insert into an update that keeps the row's id and created_at.
 */
export async function upsertForDay(db: WeightDb, date: string, weightKg: number): Promise<WeightEntry> {
  assertDate(date);
  assertWeight(weightKg);
  const now = nowIso();
  const row = await db.getFirstAsync<Row>(
    `INSERT INTO weight_entries (date, weight_kg, created_at, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg, updated_at = excluded.updated_at
     RETURNING ${COLUMNS}`,
    [date, weightKg, now, now],
  );
  if (!row) throw new Error('Saving the weigh-in returned no row');
  return toEntry(row);
}

/**
 * Edits an entry's weight and/or day. Moving it onto a day that already has a
 * weigh-in is rejected rather than silently merging two entries. Keeps created_at,
 * refreshes updated_at.
 */
export async function update(
  db: WeightDb,
  id: number,
  changes: { date?: string; weightKg?: number },
): Promise<WeightEntry> {
  assertId(id);
  if (changes.date === undefined && changes.weightKg === undefined) {
    throw new WeightEntryError('no-changes', 'Nothing to update');
  }
  if (changes.date !== undefined) assertDate(changes.date);
  if (changes.weightKg !== undefined) assertWeight(changes.weightKg);

  let updated: WeightEntry | undefined;
  // Check-then-write must not interleave with another write to the same day.
  await db.withTransactionAsync(async () => {
    if (changes.date !== undefined) {
      const clash = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM weight_entries WHERE date = ? AND id != ?',
        [changes.date, id],
      );
      if (clash) {
        throw new WeightEntryError('duplicate-date', `There's already a weigh-in on ${changes.date}`);
      }
    }
    const row = await db.getFirstAsync<Row>(
      `UPDATE weight_entries
       SET date = COALESCE(?, date), weight_kg = COALESCE(?, weight_kg), updated_at = ?
       WHERE id = ?
       RETURNING ${COLUMNS}`,
      [changes.date ?? null, changes.weightKg ?? null, nowIso(), id],
    );
    if (!row) throw new WeightEntryError('not-found', `No weigh-in with id ${id}`);
    updated = toEntry(row);
  });
  // The transaction either set `updated` or threw.
  if (!updated) throw new Error('Updating the weigh-in returned no row');
  return updated;
}

/** Deletes an entry. Throws if it doesn't exist, so a stale screen can't fail silently. */
export async function remove(db: WeightDb, id: number): Promise<void> {
  assertId(id);
  const result = await db.runAsync('DELETE FROM weight_entries WHERE id = ?', [id]);
  if (result.changes === 0) throw new WeightEntryError('not-found', `No weigh-in with id ${id}`);
}

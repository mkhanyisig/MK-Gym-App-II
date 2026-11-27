import { createTestDb, type TestDb } from '@/db/testing/nodeSqliteDb';
import {
  getByDate,
  latestTwo,
  listRecent,
  remove,
  update,
  upsertForDay,
  WeightEntryError,
} from '@/db/weightEntries';

// Real SQLite (node:sqlite) with the app's real migration, so these exercise the actual
// SQL, UNIQUE/CHECK constraints and transactions.

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-27T08:00:00.000Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

/** Asserts the promise rejects with a WeightEntryError of this code. */
async function expectCode(promise: Promise<unknown>, code: WeightEntryError['code']) {
  await expect(promise).rejects.toBeInstanceOf(WeightEntryError);
  await expect(promise).rejects.toMatchObject({ code });
}

describe('upsertForDay', () => {
  it('inserts a weigh-in and returns what was stored', async () => {
    const entry = await upsertForDay(db, '2026-11-27', 74.84274);
    expect(entry).toEqual({
      id: expect.any(Number),
      date: '2026-11-27',
      weightKg: 74.84274, // full precision, no rounding
      createdAt: '2026-11-27T08:00:00.000Z',
      updatedAt: '2026-11-27T08:00:00.000Z',
    });
  });

  it('replaces the same day instead of adding a duplicate, keeping id and createdAt', async () => {
    const first = await upsertForDay(db, '2026-11-27', 75);
    jest.setSystemTime(new Date('2026-11-27T20:30:00.000Z'));
    const second = await upsertForDay(db, '2026-11-27', 74.2);

    expect(second.id).toBe(first.id);
    expect(second.weightKg).toBe(74.2);
    expect(second.createdAt).toBe('2026-11-27T08:00:00.000Z');
    expect(second.updatedAt).toBe('2026-11-27T20:30:00.000Z');
    expect(await listRecent(db, 10)).toHaveLength(1);
  });

  it('rejects invalid days and weights without writing anything', async () => {
    await expectCode(upsertForDay(db, '2026-02-30', 75), 'invalid-date');
    await expectCode(upsertForDay(db, '27/11/2026', 75), 'invalid-date');
    await expectCode(upsertForDay(db, '2026-11-27', 0), 'invalid-weight');
    await expectCode(upsertForDay(db, '2026-11-27', -3), 'invalid-weight');
    await expectCode(upsertForDay(db, '2026-11-27', Number.NaN), 'invalid-weight');
    expect(await listRecent(db, 10)).toEqual([]);
  });
});

describe('reading', () => {
  beforeEach(async () => {
    // Inserted out of order on purpose.
    await upsertForDay(db, '2026-11-25', 75.1);
    await upsertForDay(db, '2026-11-27', 74.6);
    await upsertForDay(db, '2026-11-20', 76);
    await upsertForDay(db, '2026-11-26', 74.9);
  });

  it('lists the most recent days first, up to the limit', async () => {
    expect((await listRecent(db, 10)).map((e) => e.date)).toEqual([
      '2026-11-27',
      '2026-11-26',
      '2026-11-25',
      '2026-11-20',
    ]);
    expect((await listRecent(db, 2)).map((e) => e.date)).toEqual(['2026-11-27', '2026-11-26']);
  });

  it('latestTwo returns the newest two', async () => {
    expect((await latestTwo(db)).map((e) => e.weightKg)).toEqual([74.6, 74.9]);
  });

  it('latestTwo returns fewer when there are fewer entries', async () => {
    const fresh = await createTestDb();
    expect(await latestTwo(fresh)).toEqual([]);
    await upsertForDay(fresh, '2026-11-27', 74);
    expect(await latestTwo(fresh)).toHaveLength(1);
  });

  it('getByDate finds a day or returns null', async () => {
    expect((await getByDate(db, '2026-11-25'))?.weightKg).toBe(75.1);
    expect(await getByDate(db, '2026-11-24')).toBeNull();
    await expectCode(getByDate(db, 'tomorrow'), 'invalid-date');
  });

  it('rejects a non-positive or fractional limit', async () => {
    await expectCode(listRecent(db, 0), 'invalid-limit');
    await expectCode(listRecent(db, 2.5), 'invalid-limit');
  });
});

describe('update', () => {
  it('changes the weight, keeps createdAt and refreshes updatedAt', async () => {
    const entry = await upsertForDay(db, '2026-11-27', 75);
    jest.setSystemTime(new Date('2026-11-28T09:15:00.000Z'));
    const updated = await update(db, entry.id, { weightKg: 74.5 });

    expect(updated).toEqual({
      ...entry,
      weightKg: 74.5,
      updatedAt: '2026-11-28T09:15:00.000Z',
    });
  });

  it('can move an entry to a free day', async () => {
    const entry = await upsertForDay(db, '2026-11-27', 75);
    const moved = await update(db, entry.id, { date: '2026-11-26' });
    expect(moved.date).toBe('2026-11-26');
    expect(await getByDate(db, '2026-11-27')).toBeNull();
  });

  it('refuses to move an entry onto a day that already has one, leaving both intact', async () => {
    const a = await upsertForDay(db, '2026-11-26', 75);
    await upsertForDay(db, '2026-11-27', 74);
    await expectCode(update(db, a.id, { date: '2026-11-27', weightKg: 80 }), 'duplicate-date');

    // The transaction rolled back: nothing changed.
    expect((await listRecent(db, 10)).map((e) => [e.date, e.weightKg])).toEqual([
      ['2026-11-27', 74],
      ['2026-11-26', 75],
    ]);
  });

  it('rejects bad input and missing entries', async () => {
    const entry = await upsertForDay(db, '2026-11-27', 75);
    await expectCode(update(db, entry.id, {}), 'no-changes');
    await expectCode(update(db, entry.id, { weightKg: 0 }), 'invalid-weight');
    await expectCode(update(db, entry.id, { date: '2026-13-01' }), 'invalid-date');
    await expectCode(update(db, 0, { weightKg: 70 }), 'invalid-id');
    await expectCode(update(db, 999, { weightKg: 70 }), 'not-found');
    expect((await getByDate(db, '2026-11-27'))?.weightKg).toBe(75);
  });
});

describe('remove', () => {
  it('deletes the entry', async () => {
    const entry = await upsertForDay(db, '2026-11-27', 75);
    await remove(db, entry.id);
    expect(await listRecent(db, 10)).toEqual([]);
  });

  it('throws for an entry that no longer exists', async () => {
    const entry = await upsertForDay(db, '2026-11-27', 75);
    await remove(db, entry.id);
    await expectCode(remove(db, entry.id), 'not-found');
    await expectCode(remove(db, -1), 'invalid-id');
  });
});

describe('database errors', () => {
  it('surfaces a failed read instead of returning an empty list', async () => {
    await upsertForDay(db, '2026-11-27', 75);
    db.failNextRead(new Error('disk I/O error'));
    await expect(listRecent(db, 10)).rejects.toThrow('disk I/O error');
  });

  it('enforces the schema even if validation were bypassed', async () => {
    // Straight to SQL: the CHECK constraint is the last line of defence.
    await expect(
      db.runAsync(
        'INSERT INTO weight_entries (date, weight_kg, created_at, updated_at) VALUES (?, ?, ?, ?)',
        ['2026-11-27', -1, 'x', 'x'],
      ),
    ).rejects.toThrow(/CHECK constraint failed/);
  });
});

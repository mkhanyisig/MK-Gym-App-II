import { createTestDb, type TestDb } from '@/db/testing/nodeSqliteDb';
import { WeightEntryError } from '@/db/weightEntries';
import { createWeightStore, type WeightStore } from '@/hooks/useWeightEntries';

// The store behind useWeightEntries, against real SQLite. Each test gets a fresh store
// and database.

let db: TestDb;
let store: WeightStore;

beforeEach(async () => {
  db = await createTestDb();
  store = createWeightStore();
});

const dates = () => store.getSnapshot().entries.map((e) => e.date);

describe('loading', () => {
  it('starts empty and loads once, however many screens ask', async () => {
    expect(store.getSnapshot()).toMatchObject({ entries: [], loaded: false });

    await Promise.all([store.ensureLoaded(db), store.ensureLoaded(db), store.ensureLoaded(db)]);
    await store.ensureLoaded(db);

    expect(db.readCount()).toBe(1);
    expect(store.getSnapshot()).toMatchObject({ entries: [], loaded: true, loading: false, error: null });
  });

  it('reloads when the database is reopened', async () => {
    await store.ensureLoaded(db);
    const reopened = await createTestDb();
    await reopened.runAsync(
      'INSERT INTO weight_entries (date, weight_kg, created_at, updated_at) VALUES (?, ?, ?, ?)',
      ['2026-11-27', 75, 'x', 'x'],
    );
    await store.ensureLoaded(reopened);
    expect(dates()).toEqual(['2026-11-27']);
  });
});

describe('writes', () => {
  beforeEach(() => store.ensureLoaded(db));

  it('notifies every subscriber after SQLite confirms the write', async () => {
    const a = jest.fn();
    const b = jest.fn();
    store.subscribe(a);
    store.subscribe(b);

    const saved = await store.logWeight('2026-11-27', 74.8);

    expect(saved.weightKg).toBe(74.8);
    expect(store.getSnapshot().entries).toEqual([saved]);
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });

  it('logging the same day again replaces it', async () => {
    await store.logWeight('2026-11-27', 75);
    await store.logWeight('2026-11-27', 74.2);
    expect(store.getSnapshot().entries.map((e) => e.weightKg)).toEqual([74.2]);
  });

  it('runs concurrent writes one at a time, in order', async () => {
    await Promise.all([
      store.logWeight('2026-11-26', 75),
      store.logWeight('2026-11-27', 74.5),
      store.logWeight('2026-11-26', 74.9), // same day again: must win over the first
    ]);
    expect(store.getSnapshot().entries.map((e) => [e.date, e.weightKg])).toEqual([
      ['2026-11-27', 74.5],
      ['2026-11-26', 74.9],
    ]);
  });

  it('updates and deletes through the same queue', async () => {
    const entry = await store.logWeight('2026-11-27', 75);
    await store.updateWeight(entry.id, { weightKg: 74 });
    expect(store.getSnapshot().entries[0].weightKg).toBe(74);

    await store.deleteWeight(entry.id);
    expect(store.getSnapshot().entries).toEqual([]);
  });

  it('rejects a failed write without changing state, and later writes still run', async () => {
    await store.logWeight('2026-11-27', 75);
    const before = store.getSnapshot().entries;

    await expect(store.logWeight('2026-11-28', -1)).rejects.toBeInstanceOf(WeightEntryError);
    expect(store.getSnapshot().entries).toBe(before);

    await store.logWeight('2026-11-28', 74.5);
    expect(dates()).toEqual(['2026-11-28', '2026-11-27']);
  });
});

describe('read failures', () => {
  it('keeps the last good entries, reports the error, and recovers on refresh', async () => {
    await store.ensureLoaded(db);
    await store.logWeight('2026-11-27', 75);

    db.failNextRead(new Error('disk I/O error'));
    await store.refresh();
    expect(store.getSnapshot().error?.message).toBe('disk I/O error');
    expect(dates()).toEqual(['2026-11-27']); // not blanked

    await store.refresh();
    expect(store.getSnapshot().error).toBeNull();
    expect(dates()).toEqual(['2026-11-27']);
  });

  it('a failed first load can be retried', async () => {
    db.failNextRead();
    await store.ensureLoaded(db);
    expect(store.getSnapshot()).toMatchObject({ loaded: false, error: expect.any(Error) });

    await store.refresh();
    expect(store.getSnapshot()).toMatchObject({ loaded: true, error: null });
  });
});

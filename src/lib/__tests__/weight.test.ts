import {
  findEntryForDay,
  isDayKey,
  isValidWeightKg,
  planWeightSave,
  todayKey,
  weightChange,
  type WeightEntry,
} from '@/lib/weight';

describe('todayKey', () => {
  it('formats the local day as YYYY-MM-DD with zero padding', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('uses the local day at both ends of the day', () => {
    expect(todayKey(new Date(2026, 2, 1, 0, 0, 0))).toBe('2026-03-01');
    expect(todayKey(new Date(2026, 2, 1, 23, 59, 59))).toBe('2026-03-01');
  });

  it('handles leap days', () => {
    expect(todayKey(new Date(2028, 1, 29))).toBe('2028-02-29');
  });

  it('defaults to now', () => {
    const now = new Date();
    expect(todayKey()).toBe(todayKey(now));
  });

  describe('west of UTC', () => {
    const originalTz = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = 'America/Los_Angeles';
    });
    afterAll(() => {
      process.env.TZ = originalTz;
    });

    it('stays on the local day late in the evening, when the UTC day has already changed', () => {
      const lateEvening = new Date(2026, 10, 27, 23, 30); // 23:30 local = next day in UTC
      expect(lateEvening.toISOString().slice(0, 10)).toBe('2026-11-28');
      expect(todayKey(lateEvening)).toBe('2026-11-27');
    });
  });
});

describe('isDayKey', () => {
  it('accepts real calendar days, including leap days', () => {
    expect(isDayKey('2026-11-27')).toBe(true);
    expect(isDayKey('2028-02-29')).toBe(true);
  });

  it('rejects impossible days and other formats', () => {
    expect(isDayKey('2026-02-30')).toBe(false);
    expect(isDayKey('2027-02-29')).toBe(false); // not a leap year
    expect(isDayKey('2026-13-01')).toBe(false);
    expect(isDayKey('2026-1-5')).toBe(false);
    expect(isDayKey('2026-11-27T10:00:00Z')).toBe(false);
    expect(isDayKey('')).toBe(false);
  });

  it('agrees with todayKey', () => {
    expect(isDayKey(todayKey())).toBe(true);
  });
});

describe('isValidWeightKg', () => {
  it('accepts positive finite numbers', () => {
    expect(isValidWeightKg(74.84274)).toBe(true);
    expect(isValidWeightKg(0.1)).toBe(true);
  });

  it('rejects zero, negatives and non-finite values', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) expect(isValidWeightKg(bad)).toBe(false);
  });
});

describe('weightChange', () => {
  const entry = (date: string, weightKg: number): WeightEntry => ({
    id: 1,
    date,
    weightKg,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  it('is null with fewer than two entries', () => {
    expect(weightChange(null, null)).toBeNull();
    expect(weightChange(entry('2026-11-27', 75), null)).toBeNull();
  });

  it('is negative for a loss and positive for a gain, in kg', () => {
    expect(weightChange(entry('2026-11-27', 74.4), entry('2026-11-24', 75))?.deltaKg).toBeCloseTo(-0.6, 10);
    expect(weightChange(entry('2026-11-27', 75.5), entry('2026-11-24', 75))?.deltaKg).toBeCloseTo(0.5, 10);
  });

  it('reports the earlier day the change is measured from', () => {
    expect(weightChange(entry('2026-11-27', 74), entry('2026-11-24', 75))?.sinceDate).toBe('2026-11-24');
  });

  it('is zero, not null, when the weight did not change', () => {
    expect(weightChange(entry('2026-11-27', 75), entry('2026-11-26', 75))).toEqual({
      deltaKg: 0,
      sinceDate: '2026-11-26',
    });
  });
});

describe('saving from the weight form', () => {
  const make = (id: number, date: string, weightKg: number): WeightEntry => ({
    id,
    date,
    weightKg,
    createdAt: '2026-11-20T08:00:00.000Z',
    updatedAt: '2026-11-20T08:00:00.000Z',
  });
  const today = '2026-11-27';
  const todayEntry = make(2, today, 75);
  const older = make(1, '2026-11-25', 76);

  it('findEntryForDay finds the day or returns null', () => {
    expect(findEntryForDay([todayEntry, older], today)).toBe(todayEntry);
    expect(findEntryForDay([older], today)).toBeNull();
  });

  it('creates when today has no weigh-in', () => {
    expect(
      planWeightSave({ weightKg: 74.8, today, entries: [older], editing: null, units: 'metric' }),
    ).toEqual({
      kind: 'create',
      date: today,
      weightKg: 74.8,
    });
  });

  it('asks to replace when today is already logged with a different value', () => {
    expect(
      planWeightSave({ weightKg: 74.2, today, entries: [todayEntry, older], editing: null, units: 'metric' }),
    ).toEqual({ kind: 'replace', existing: todayEntry, weightKg: 74.2 });
  });

  it('updates the entry being edited, keeping it (not today) as the target', () => {
    expect(
      planWeightSave({
        weightKg: 75.5,
        today,
        entries: [todayEntry, older],
        editing: older,
        units: 'metric',
      }),
    ).toEqual({ kind: 'update', existing: older, weightKg: 75.5 });
  });

  it("treats a value that displays the same as unchanged, in the user's units", () => {
    expect(
      planWeightSave({ weightKg: 75.04, today, entries: [todayEntry], editing: null, units: 'metric' }),
    ).toEqual({ kind: 'unchanged', existing: todayEntry });
    // 75 kg shows as 165.3 lbs; typing 165.3 lbs back is not a change.
    expect(
      planWeightSave({
        weightKg: 165.3 * 0.45359237,
        today,
        entries: [todayEntry],
        editing: null,
        units: 'imperial',
      }),
    ).toEqual({ kind: 'unchanged', existing: todayEntry });
  });
});

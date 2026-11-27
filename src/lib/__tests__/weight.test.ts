import { todayKey } from '@/lib/weight';

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

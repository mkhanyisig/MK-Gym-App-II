import { formatDate, formatDuration } from '@/lib/format';

describe('formatDuration', () => {
  it.each([
    [0, '00:00:00'],
    [999, '00:00:00'],
    [59_000, '00:00:59'],
    [61_000, '00:01:01'],
    [3_723_000, '01:02:03'],
  ])('%p ms → %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});

describe('formatDate', () => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  it('treats YYYY-MM-DD as a local calendar day', () => {
    expect(formatDate('2026-01-05')).toBe(new Date(2026, 0, 5).toLocaleDateString(undefined, options));
  });

  describe('west of UTC', () => {
    const originalTz = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = 'America/Los_Angeles';
    });
    afterAll(() => {
      process.env.TZ = originalTz;
    });

    it('does not shift to the previous day', () => {
      // Parsing '2026-01-05' as UTC would show Jan 4 here; the local parse must not.
      const formatted = formatDate('2026-01-05');
      expect(formatted).toBe(new Date(2026, 0, 5).toLocaleDateString(undefined, options));
      expect(new Date(2026, 0, 5).getTimezoneOffset()).toBeGreaterThan(0);
    });
  });
});

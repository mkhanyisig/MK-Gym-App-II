import { greeting, timeOfDay, welcomeLine } from '@/lib/greeting';

/** A local-time Date on an arbitrary day, so tests don't depend on the machine's time zone. */
const at = (hours: number, minutes = 0) => new Date(2026, 10, 27, hours, minutes);

describe('timeOfDay', () => {
  it.each([
    [at(4, 59), 'evening'],
    [at(5, 0), 'morning'],
    [at(11, 59), 'morning'],
    [at(12, 0), 'afternoon'],
    [at(16, 59), 'afternoon'],
    [at(17, 0), 'evening'],
    [at(0, 0), 'evening'],
  ])('%p → %s', (date, expected) => {
    expect(timeOfDay(date)).toBe(expected);
  });
});

describe('greeting', () => {
  it('includes the name and the time-of-day emoji', () => {
    expect(greeting(at(8), 'Sam')).toBe('Good morning, Sam ☀️');
    expect(greeting(at(13), 'Sam')).toBe('Good afternoon, Sam 🌤️');
    expect(greeting(at(20), 'Sam')).toBe('Good evening, Sam 🌙');
  });

  it('drops the name when it is missing or blank', () => {
    expect(greeting(at(8))).toBe('Good morning ☀️');
    expect(greeting(at(8), '   ')).toBe('Good morning ☀️');
    expect(greeting(at(8), null)).toBe('Good morning ☀️');
  });
});

describe('welcomeLine', () => {
  it('welcomes a known name back', () => {
    expect(welcomeLine('Lex')).toBe('Welcome back, Lex.');
    expect(welcomeLine('  Lex  ')).toBe('Welcome back, Lex.');
  });

  it('falls back to a plain welcome without a name', () => {
    expect(welcomeLine('')).toBe('Welcome back.');
    expect(welcomeLine(undefined)).toBe('Welcome back.');
  });
});

import { nextReminder, REMINDER_HOURS, reminderTimes } from '@/lib/reminders';

const at = (day: number, hour: number, minute = 0) => new Date(2026, 10, day, hour, minute);
const stamp = (d: Date) => `${d.getDate()} ${d.getHours()}:00`;

describe('reminderTimes', () => {
  it('schedules 10:00, 16:00 and 22:00 every day for a week when nothing is logged', () => {
    const times = reminderTimes(at(27, 8), false);
    expect(times).toHaveLength(7 * REMINDER_HOURS.length);
    expect(times.slice(0, 4).map(stamp)).toEqual(['27 10:00', '27 16:00', '27 22:00', '28 10:00']);
    expect(stamp(times.at(-1)!)).toBe('3 22:00'); // Dec 3, the seventh day
  });

  it('skips times already past today', () => {
    expect(reminderTimes(at(27, 12), false).slice(0, 2).map(stamp)).toEqual(['27 16:00', '27 22:00']);
    expect(reminderTimes(at(27, 16, 0), false)[0]).toEqual(at(27, 22)); // exactly 16:00 has passed
  });

  it('after 22:00 the next reminder is tomorrow at 10:00', () => {
    expect(nextReminder(at(27, 22, 30), false)).toEqual(at(28, 10));
  });

  it('leaves out the rest of today once today is logged', () => {
    const times = reminderTimes(at(27, 9), true);
    expect(times.map(stamp).some((t) => t.startsWith('27 '))).toBe(false);
    expect(times[0]).toEqual(at(28, 10));
    expect(times).toHaveLength(6 * REMINDER_HOURS.length);
  });

  it('only uses hours between 10am and midnight, in order', () => {
    const times = reminderTimes(at(27, 0), false);
    expect(times.every((t) => t.getHours() >= 10 && t.getHours() < 24)).toBe(true);
    expect(times.every((t, i) => i === 0 || t > times[i - 1])).toBe(true);
  });

  it('crosses month ends correctly', () => {
    expect(nextReminder(new Date(2026, 10, 30, 23), false)).toEqual(new Date(2026, 11, 1, 10));
  });
});

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

/** Morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–04:59 (local time). */
export function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

const TIME_OF_DAY_EMOJI: Record<TimeOfDay, string> = {
  morning: '☀️',
  afternoon: '🌤️',
  evening: '🌙',
};

/** "Good evening, Sam 🌙" or "Good evening 🌙" when there's no name. */
export function greeting(date: Date, name?: string | null): string {
  const period = timeOfDay(date);
  const trimmed = name?.trim();
  return `Good ${period}${trimmed ? `, ${trimmed}` : ''} ${TIME_OF_DAY_EMOJI[period]}`;
}

/** "Welcome back, Sam." for a known name, otherwise just "Welcome back." */
export function welcomeLine(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? `Welcome back, ${trimmed}.` : 'Welcome back.';
}

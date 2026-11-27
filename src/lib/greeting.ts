export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

/** Morning 05:00–11:59, afternoon 12:00–16:59, evening 17:00–04:59 (local time). */
export function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

/** "Good evening, Sam." or "Good evening." when there's no name. */
export function greeting(date: Date, name?: string | null): string {
  const base = `Good ${timeOfDay(date)}`;
  const trimmed = name?.trim();
  return trimmed ? `${base}, ${trimmed}.` : `${base}.`;
}

/** "Thursday · 27 November" (rendered uppercase by the label style). */
export function formatDateLabel(date: Date): string {
  const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
  const dayMonth = date.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
  return `${weekday} · ${dayMonth}`;
}

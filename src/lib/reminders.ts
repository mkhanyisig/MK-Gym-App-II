/**
 * Daily weigh-in reminder schedule (pure logic, no notification APIs).
 *
 * A scheduled notification can't check "has today been logged?" when it fires, because
 * the app isn't running. So the app schedules each reminder individually for the next
 * few days, and rebuilds that schedule whenever it opens or a weigh-in changes:
 * once today is logged, today's remaining reminders are simply left out.
 */

/** Local hours for reminders: every 6 hours between 10am and midnight. */
export const REMINDER_HOURS = [10, 16, 22] as const;

/** How many days ahead to schedule. Reminders pause if the app isn't opened for this long. */
export const REMINDER_DAYS_AHEAD = 7;

/**
 * The upcoming reminder times, oldest first: each REMINDER_HOURS slot for today and the
 * next `days - 1` days, skipping times already past and, if today is logged, the rest
 * of today. Built from local date parts, so it follows the device's time zone and DST.
 */
export function reminderTimes(now: Date, loggedToday: boolean, days: number = REMINDER_DAYS_AHEAD): Date[] {
  const times: Date[] = [];
  for (let offset = 0; offset < days; offset++) {
    if (offset === 0 && loggedToday) continue;
    for (const hour of REMINDER_HOURS) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, 0, 0, 0);
      if (at.getTime() > now.getTime()) times.push(at);
    }
  }
  return times;
}

/** The next reminder still to come, or null if none are scheduled. */
export function nextReminder(now: Date, loggedToday: boolean): Date | null {
  return reminderTimes(now, loggedToday)[0] ?? null;
}

/** "10:00 · 16:00 · 22:00" in the device's 12/24-hour style. */
export function formatReminderHours(locale?: string): string {
  return REMINDER_HOURS.map((hour) =>
    new Date(2000, 0, 1, hour).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }),
  ).join(' · ');
}

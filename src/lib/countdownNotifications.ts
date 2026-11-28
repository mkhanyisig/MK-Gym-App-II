import { type Countdown, countdownDone, formatCountdown } from '@/lib/clock';

/**
 * What the countdown's notifications should be for its current state. Pure, so every
 * state transition is unit tested; src/notifications/countdown.ts applies the plan.
 *
 * Two notifications at most, each with a fixed identifier:
 * - status: a STATIC lock-screen note ("Countdown running · Ends at 3:45 PM"). A normal
 *   notification can't tick every second; a live, ticking lock-screen countdown needs an
 *   iOS Live Activity (native widget extension, development build), which is a separate
 *   follow-up. The note is replaced on pause/resume and removed on cancel or finish.
 * - completion alert: the "Time's up" alert scheduled for when a running countdown ends.
 */
export type CountdownNotificationPlan = {
  phase: 'none' | 'running' | 'paused' | 'done';
  status: { title: string; body: string } | null;
  /** When to fire the completion alert, or null for none. */
  alertAt: number | null;
};

export function planCountdownNotifications(
  cd: Countdown,
  now: number,
  /** Formats a timestamp as a local time of day, e.g. "3:45 PM". */
  formatTime: (ms: number) => string,
): CountdownNotificationPlan {
  if (cd.status === 'idle') return { phase: 'none', status: null, alertAt: null };
  if (countdownDone(cd, now)) return { phase: 'done', status: null, alertAt: null };
  if (cd.status === 'running' && cd.endsAt != null) {
    return {
      phase: 'running',
      status: {
        title: 'Countdown running',
        body: `Ends at ${formatTime(cd.endsAt)} · ${formatCountdown(cd.durationMs)} timer`,
      },
      alertAt: cd.endsAt,
    };
  }
  return {
    phase: 'paused',
    status: { title: 'Countdown paused', body: `${formatCountdown(cd.remainingMs)} left` },
    alertAt: null,
  };
}

/** "3:45 PM" in the phone's locale. */
export const formatTimeOfDay = (ms: number): string =>
  new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

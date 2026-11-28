import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Vibration } from 'react-native';

import { useClockNow } from '@/hooks/useClockNow';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  COUNTDOWN_STORAGE_KEY,
  countdownDone,
  countdownProgress,
  countdownRemaining,
  newCountdown,
  pauseCountdown,
  resetCountdown,
  restoreCountdown,
  setCountdownDuration,
  startCountdown,
} from '@/lib/clock';
import { formatTimeOfDay, planCountdownNotifications } from '@/lib/countdownNotifications';
import { syncCountdownNotifications } from '@/notifications/countdown';

/** Ten refreshes a second: whole seconds land on time and the progress ring moves smoothly. */
const TICK_MS = 100;

/** A finish counts as "just now" (worth a vibration) within this window. */
const JUST_FINISHED_MS = 2_000;

/**
 * A countdown backed by the timestamp model in src/lib/clock.ts, saved on the device so it
 * survives the app being closed.
 * - Finishing while the app is open: one vibration and a screen-reader announcement.
 * - Finishing in the background or with the app closed: a scheduled "Time's up"
 *   notification (native only, if notifications are allowed).
 */
export function useCountdown(initialMs: number) {
  const [cd, setCd] = usePersistedState(
    COUNTDOWN_STORAGE_KEY,
    () => newCountdown(initialMs),
    restoreCountdown,
  );
  const now = useClockNow(cd.status === 'running', TICK_MS);
  const done = countdownDone(cd, now);

  // Signal completion once per run (a new run starts after Reset). Only when it finished
  // just now: one that ended while the app was away already had its notification.
  const signalled = useRef(false);
  const endsAt = cd.endsAt;
  useEffect(() => {
    if (done && !signalled.current) {
      signalled.current = true;
      if (endsAt != null && Date.now() - endsAt < JUST_FINISHED_MS) {
        Vibration.vibrate(400);
        AccessibilityInfo.announceForAccessibility('Countdown finished');
      }
    }
    if (!done) signalled.current = false;
  }, [done, endsAt]);

  // Keep the phone's notifications in step: the lock-screen status note and the
  // "Time's up" alert. `cd` changes on Start, Pause, Cancel, Restart, a new duration or
  // loading the saved state; `done` flips when it reaches zero in the app.
  useEffect(() => {
    syncCountdownNotifications(planCountdownNotifications(cd, Date.now(), formatTimeOfDay)).catch(
      (error: unknown) => {
        console.warn('Could not update the countdown notifications', error);
      },
    );
  }, [cd, done]);

  return {
    status: done ? ('done' as const) : cd.status,
    durationMs: cd.durationMs,
    remainingMs: countdownRemaining(cd, now),
    /** 1 (full) to 0 (finished), for the progress ring. */
    progress: countdownProgress(cd, now),
    setDuration: (ms: number) => setCd((c) => setCountdownDuration(c, ms)),
    start: () => setCd((c) => startCountdown(c, Date.now())),
    pause: () => setCd((c) => pauseCountdown(c, Date.now())),
    reset: () => setCd((c) => resetCountdown(c)),
  };
}

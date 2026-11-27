import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Vibration } from 'react-native';

import { useClockNow } from '@/hooks/useClockNow';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  countdownAlertAt,
  countdownDone,
  countdownRemaining,
  newCountdown,
  pauseCountdown,
  resetCountdown,
  restoreCountdown,
  setCountdownDuration,
  startCountdown,
} from '@/lib/clock';
import { syncCountdownAlert } from '@/notifications/countdown';

/** Whole seconds are shown; refresh a few times a second so changes land on time. */
const TICK_MS = 200;

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
    'clock.countdown.v1',
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

  // Keep the background alert in step: scheduled while running, cancelled otherwise.
  // `cd` only changes on Start, Pause, Reset, a new duration, or loading the saved state.
  useEffect(() => {
    syncCountdownAlert(countdownAlertAt(cd, Date.now())).catch((error: unknown) => {
      console.warn('Could not update the countdown alert', error);
    });
  }, [cd]);

  return {
    status: done ? ('done' as const) : cd.status,
    durationMs: cd.durationMs,
    remainingMs: countdownRemaining(cd, now),
    setDuration: (ms: number) => setCd((c) => setCountdownDuration(c, ms)),
    start: () => setCd((c) => startCountdown(c, Date.now())),
    pause: () => setCd((c) => pauseCountdown(c, Date.now())),
    reset: () => setCd((c) => resetCountdown(c)),
  };
}

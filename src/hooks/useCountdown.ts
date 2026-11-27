import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Vibration } from 'react-native';

import { useClockNow } from '@/hooks/useClockNow';
import {
  countdownDone,
  countdownRemaining,
  newCountdown,
  pauseCountdown,
  resetCountdown,
  setCountdownDuration,
  startCountdown,
} from '@/lib/clock';

/** Whole seconds are shown; refresh a few times a second so changes land on time. */
const TICK_MS = 200;

/**
 * A countdown backed by the timestamp model in src/lib/clock.ts. When it reaches zero
 * while the app is open it vibrates once and tells screen readers; completion is
 * otherwise shown on screen. There is no alert while the app is in the background.
 */
export function useCountdown(initialMs: number) {
  const [cd, setCd] = useState(() => newCountdown(initialMs));
  const now = useClockNow(cd.status === 'running', TICK_MS);
  const done = countdownDone(cd, now);

  // Signal completion once per run (a new run starts after Reset).
  const signalled = useRef(false);
  useEffect(() => {
    if (done && !signalled.current) {
      signalled.current = true;
      Vibration.vibrate(400);
      AccessibilityInfo.announceForAccessibility('Countdown finished');
    }
    if (!done) signalled.current = false;
  }, [done]);

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

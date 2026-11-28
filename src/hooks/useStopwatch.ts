import { useClockNow } from '@/hooks/useClockNow';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  lapStopwatch,
  newStopwatch,
  pauseStopwatch,
  resetStopwatch,
  STOPWATCH_STORAGE_KEY,
  restoreStopwatch,
  startStopwatch,
  stopwatchElapsed,
  stopwatchLaps,
} from '@/lib/clock';

/** Hundredths show for the first hour, so refresh about 20 times a second while running. */
const TICK_MS = 50;

/**
 * A stopwatch with laps, backed by the timestamp model in src/lib/clock.ts. It's saved on
 * the device, so it survives the app being closed (and keeps counting if it was running).
 */
export function useStopwatch() {
  const [sw, setSw] = usePersistedState(STOPWATCH_STORAGE_KEY, newStopwatch, restoreStopwatch);
  const now = useClockNow(sw.status === 'running', TICK_MS);

  return {
    status: sw.status,
    elapsedMs: stopwatchElapsed(sw, now),
    laps: stopwatchLaps(sw, now),
    start: () => setSw((s) => startStopwatch(s, Date.now())),
    pause: () => setSw((s) => pauseStopwatch(s, Date.now())),
    lap: () => setSw((s) => lapStopwatch(s, Date.now())),
    reset: () => setSw((s) => resetStopwatch(s)),
  };
}

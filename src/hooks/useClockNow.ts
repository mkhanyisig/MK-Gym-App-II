import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * The current time for a running clock display. Re-renders every `intervalMs` while
 * `active`, and immediately when the app returns to the foreground. It only drives the
 * display: clock values are computed from timestamps, so a late or skipped tick (e.g.
 * while backgrounded) never makes them wrong.
 */
export function useClockNow(active: boolean, intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Catch up straight away when the clock starts or stops, then keep ticking while active.
    const first = setTimeout(tick, 0);
    const id = active ? setInterval(tick, intervalMs) : undefined;
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active, intervalMs]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') setNow(Date.now());
    });
    return () => subscription.remove();
  }, []);

  return now;
}

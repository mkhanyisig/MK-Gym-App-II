import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * The current time, refreshed at the start of every minute and whenever the app
 * returns to the foreground, so time-of-day text never goes stale.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = new Date();
      setNow(current);
      // Wake just after the next minute boundary rather than polling.
      timer = setTimeout(tick, 60_000 - (current.getTime() % 60_000) + 50);
    };
    timer = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        clearTimeout(timer);
        tick();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return now;
}

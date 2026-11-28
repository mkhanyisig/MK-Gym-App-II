import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { UNSUPPORTED_AUDIBILITY } from '@/lib/notificationPermission';
import { type AlertAudibility, getAlertAudibility, notificationsSupported } from '@/notifications/setup';

/**
 * Whether a countdown's "Time's up" will be an audible alert, and if not, why. Re-checked
 * when the app returns to the foreground, e.g. after changing iPhone Settings.
 */
export function useAlertAudibility(): {
  audibility: AlertAudibility | null;
  refresh: () => Promise<AlertAudibility>;
} {
  const [audibility, setAudibility] = useState<AlertAudibility | null>(
    notificationsSupported ? null : UNSUPPORTED_AUDIBILITY,
  );

  const refresh = useCallback(async () => {
    const next = await getAlertAudibility();
    setAudibility(next);
    return next;
  }, []);

  useEffect(() => {
    if (!notificationsSupported) return;
    void getAlertAudibility().then(setAudibility);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void getAlertAudibility().then(setAudibility);
    });
    return () => subscription.remove();
  }, []);

  return { audibility, refresh };
}

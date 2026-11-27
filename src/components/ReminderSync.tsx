import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useNow } from '@/hooks/useNow';
import { useReminders } from '@/hooks/useReminders';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { findEntryForDay, todayKey } from '@/lib/weight';
import { onReminderOpened, syncReminders } from '@/notifications/reminders';

/**
 * Keeps scheduled weigh-in reminders in step with the app (renders nothing). It rebuilds
 * the schedule when reminders are switched on or off, when today's weigh-in is logged or
 * removed, when the day changes, and when the app returns to the foreground. It also makes
 * the one-time reminder offer after the first weigh-in, and opens Weight when a reminder
 * is tapped.
 */
export function ReminderSync() {
  const { entries, loaded: weighInsLoaded } = useWeightEntries();
  const reminders = useReminders();
  const today = todayKey(useNow());
  const loggedToday = findEntryForDay(entries, today) != null;
  // Bumped when the app comes back to the foreground, to resync and re-check permission.
  const [foregrounds, setForegrounds] = useState(0);
  const { loaded, enabled, permission, refreshPermission, offerAfterFirstWeighIn } = reminders;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') setForegrounds((n) => n + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => onReminderOpened(() => router.push('/weight')), []);

  useEffect(() => {
    if (foregrounds > 0) void refreshPermission();
  }, [foregrounds, refreshPermission]);

  // After the first weigh-in, ask once (never again, whatever the answer).
  useEffect(() => {
    if (loaded && weighInsLoaded && entries.length > 0) void offerAfterFirstWeighIn();
  }, [loaded, weighInsLoaded, entries.length, offerAfterFirstWeighIn]);

  useEffect(() => {
    if (!loaded || !weighInsLoaded) return;
    syncReminders({ enabled, loggedToday }).catch((error: unknown) => {
      console.warn('Could not update weigh-in reminders', error);
    });
  }, [loaded, weighInsLoaded, enabled, permission, loggedToday, today, foregrounds]);

  return null;
}

import * as Notifications from 'expo-notifications';

import {
  ChannelId,
  configureNotifications,
  getNotificationPermission,
  NotificationKind,
  notificationsSupported,
  onNotificationOpened,
  requestNotificationPermission,
} from '@/notifications/setup';

/** One countdown at a time, so one fixed id: scheduling again replaces the previous alert. */
const IDENTIFIER = 'countdown-done';

// Syncs run one at a time so a quick pause and resume can't leave a stale alert behind.
let syncQueue: Promise<unknown> = Promise.resolve();

/**
 * Schedules the "Time's up" alert for `alertAt` (a timestamp), replacing any earlier one,
 * or just cancels it when `alertAt` is null. The first time a countdown runs, this asks
 * for notification permission; without it, completion is shown only in the app.
 */
export function syncCountdownAlert(alertAt: number | null): Promise<void> {
  if (!notificationsSupported) return Promise.resolve();
  const run = syncQueue.then(async () => {
    await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
    if (alertAt == null) return;
    await configureNotifications();
    const permission =
      (await getNotificationPermission()) === 'undetermined'
        ? await requestNotificationPermission()
        : await getNotificationPermission();
    if (permission !== 'granted' || alertAt <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: IDENTIFIER,
      content: {
        title: 'Time’s up',
        body: 'Your countdown has finished.',
        sound: true,
        data: { kind: NotificationKind.countdownDone, url: '/clock' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(alertAt),
        channelId: ChannelId.countdown,
      },
    });
  });
  syncQueue = run.catch(() => undefined);
  return run;
}

/** Calls `onOpen` when the user taps the countdown alert, including one that launched the app. */
export function onCountdownAlertOpened(onOpen: () => void): () => void {
  return onNotificationOpened(NotificationKind.countdownDone, onOpen);
}

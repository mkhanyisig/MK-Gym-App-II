import * as Notifications from 'expo-notifications';

import { reminderTimes } from '@/lib/reminders';
import {
  ChannelId,
  configureNotifications,
  getNotificationPermission,
  type NotificationPermission,
  NotificationKind,
  notificationsSupported,
  onNotificationOpened,
  requestNotificationPermission,
} from '@/notifications/setup';

/**
 * Weigh-in reminders: scheduling and permission. Shared setup (foreground handling,
 * channels, permission) lives in ./setup. Everything here is a no-op on web.
 */

export const remindersSupported = notificationsSupported;

const CHANNEL_ID = ChannelId.weighInReminders;
/** Tags our notifications so we only ever cancel our own. */
const KIND = NotificationKind.weighInReminder;

export type ReminderPermission = NotificationPermission;

/** Current permission, without prompting. */
export const getReminderPermission = getNotificationPermission;

/** Shows the OS permission prompt if it's still allowed to; otherwise returns the current state. */
export const requestReminderPermission = requestNotificationPermission;

// Syncs run one at a time so two quick updates can't schedule duplicates.
let syncQueue: Promise<unknown> = Promise.resolve();

/**
 * Replaces our scheduled reminders with the current plan: none if reminders are off
 * or not permitted, otherwise each upcoming time from `reminderTimes` (skipping the rest
 * of today once it's logged). Resolves with how many were scheduled.
 */
export function syncReminders({
  enabled,
  loggedToday,
  now = new Date(),
}: {
  enabled: boolean;
  loggedToday: boolean;
  now?: Date;
}): Promise<number> {
  if (!remindersSupported) return Promise.resolve(0);
  const run = syncQueue.then(async () => {
    await configureNotifications();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((request) => request.content.data?.kind === KIND)
        .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
    );
    if (!enabled || (await getReminderPermission()) !== 'granted') return 0;

    const times = reminderTimes(now, loggedToday);
    for (const date of times) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to weigh in',
          body: 'You haven’t logged today’s weight yet.',
          data: { kind: KIND, url: '/weight' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
      });
    }
    return times.length;
  });
  syncQueue = run.catch(() => undefined);
  return run;
}

/** Calls `onOpen` when the user taps one of our reminders, including one that launched the app. */
export function onReminderOpened(onOpen: () => void): () => void {
  return onNotificationOpened(KIND, onOpen);
}

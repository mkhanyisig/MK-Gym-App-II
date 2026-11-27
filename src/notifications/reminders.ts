import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

import { reminderTimes } from '@/lib/reminders';

/**
 * The only module that talks to expo-notifications. Local, on-device reminders only:
 * no push server, no accounts. Web has no scheduled notifications, so everything here
 * is a no-op there.
 */

export const remindersSupported = Platform.OS !== 'web';

const CHANNEL_ID = 'weigh-in-reminders';
/** Tags our notifications so we only ever cancel our own. */
const KIND = 'weigh-in-reminder';

export type ReminderPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

let configured: Promise<void> | null = null;

/** Show reminders even while the app is open, and set up the Android channel (once). */
function configure(): Promise<void> {
  configured ??= (async () => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    // Android 8+: every notification needs a channel, and Android 13+ only shows the
    // permission prompt once a channel exists.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Weigh-in reminders',
        importance: AndroidImportance.DEFAULT,
      });
    }
  })();
  return configured;
}

function toPermission(response: Notifications.NotificationPermissionsStatus): ReminderPermission {
  const provisional = response.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  if (response.granted || provisional) return 'granted';
  return response.canAskAgain ? 'undetermined' : 'denied';
}

/** Current permission, without prompting. */
export async function getReminderPermission(): Promise<ReminderPermission> {
  if (!remindersSupported) return 'unsupported';
  return toPermission(await Notifications.getPermissionsAsync());
}

/** Shows the OS permission prompt if it's still allowed to; otherwise returns the current state. */
export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!remindersSupported) return 'unsupported';
  await configure();
  const current = await getReminderPermission();
  if (current !== 'undetermined') return current;
  return toPermission(await Notifications.requestPermissionsAsync());
}

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
    await configure();
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
  if (!remindersSupported) return () => {};
  const isOurs = (response: Notifications.NotificationResponse | null) =>
    response?.notification.request.content.data?.kind === KIND;

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (isOurs(response)) onOpen();
  });
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (isOurs(response)) onOpen();
  });
  return () => subscription.remove();
}

import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Shared expo-notifications setup: how alerts show while the app is open, the Android
 * channels, permission, and taps. Local, on-device notifications only: no push server,
 * no accounts. Web has no scheduled notifications, so callers treat it as unsupported.
 */

export const notificationsSupported = Platform.OS !== 'web';

/** `data.kind` tags, so each feature only ever touches its own notifications. */
export const NotificationKind = {
  weighInReminder: 'weigh-in-reminder',
  countdownDone: 'countdown-done',
} as const;

export const ChannelId = {
  weighInReminders: 'weigh-in-reminders',
  countdown: 'countdown',
} as const;

export type NotificationPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

let configured: Promise<void> | null = null;

/** Sets up the foreground handler and Android channels (once). */
export function configureNotifications(): Promise<void> {
  configured ??= (async () => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // A countdown that finishes while the app is open is already shown on screen
        // (and vibrates), so its alert is only for when the app is in the background.
        const show = notification.request.content.data?.kind !== NotificationKind.countdownDone;
        return {
          shouldShowBanner: show,
          shouldShowList: show,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      },
    });
    // Android 8+: every notification needs a channel, and Android 13+ only shows the
    // permission prompt once a channel exists.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ChannelId.weighInReminders, {
        name: 'Weigh-in reminders',
        importance: AndroidImportance.DEFAULT,
      });
      await Notifications.setNotificationChannelAsync(ChannelId.countdown, {
        name: 'Countdown',
        importance: AndroidImportance.HIGH,
      });
    }
  })();
  return configured;
}

function toPermission(response: Notifications.NotificationPermissionsStatus): NotificationPermission {
  const provisional = response.ios?.status === IosAuthorizationStatus.PROVISIONAL;
  if (response.granted || provisional) return 'granted';
  return response.canAskAgain ? 'undetermined' : 'denied';
}

/** Current permission, without prompting. */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported) return 'unsupported';
  return toPermission(await Notifications.getPermissionsAsync());
}

/** Shows the OS permission prompt if it's still allowed to; otherwise returns the current state. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported) return 'unsupported';
  await configureNotifications();
  const current = await getNotificationPermission();
  if (current !== 'undetermined') return current;
  return toPermission(await Notifications.requestPermissionsAsync());
}

/** Calls `onOpen` when the user taps a notification of `kind`, including one that launched the app. */
export function onNotificationOpened(kind: string, onOpen: () => void): () => void {
  if (!notificationsSupported) return () => {};
  const isOurs = (response: Notifications.NotificationResponse | null) =>
    response?.notification.request.content.data?.kind === kind;

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (isOurs(response)) onOpen();
  });
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (isOurs(response)) onOpen();
  });
  return () => subscription.remove();
}

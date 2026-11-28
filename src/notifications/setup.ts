import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import {
  type AlertAudibility,
  describeAlerts,
  type NotificationPermission,
  toPermission,
  UNSUPPORTED_AUDIBILITY,
} from '@/lib/notificationPermission';

export type { AlertAudibility, NotificationPermission };

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
  /** The static "Countdown running / paused" lock-screen note (not a live, ticking widget). */
  countdownStatus: 'countdown-status',
} as const;

export const ChannelId = {
  weighInReminders: 'weigh-in-reminders',
  countdown: 'countdown',
} as const;

let configured: Promise<void> | null = null;

/** Sets up the foreground handler and Android channels (once). */
export function configureNotifications(): Promise<void> {
  configured ??= (async () => {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // While the app is open the Clock already shows the countdown, so countdown
        // notifications don't pop up as banners then. The status note still goes into
        // the list so it's on the lock screen once you leave. "Time's up" plays its sound
        // (only): the notification is the one source of the completion sound, open or
        // closed, so it's never played twice and iOS applies Silent, Focus and the app's
        // Sounds setting to it.
        const kind = notification.request.content.data?.kind;
        const done = kind === NotificationKind.countdownDone;
        const countdown = done || kind === NotificationKind.countdownStatus;
        return {
          shouldShowBanner: !countdown,
          shouldShowList: !done,
          shouldPlaySound: done,
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

/** Current permission, without prompting. */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported) return 'unsupported';
  return toPermission(await Notifications.getPermissionsAsync());
}

/** Whether a countdown's "Time's up" will be an alert with sound, and if not, why. */
export async function getAlertAudibility(): Promise<AlertAudibility> {
  if (!notificationsSupported) return UNSUPPORTED_AUDIBILITY;
  return describeAlerts(await Notifications.getPermissionsAsync());
}

/**
 * Shows the OS permission prompt if it's still allowed to: when never asked, or when iOS
 * only granted provisional (quiet) delivery, which it lets an app upgrade by asking for
 * full alert, badge and sound permission. Otherwise returns the current state without
 * prompting; a denied or muted app can only be changed in the phone's Settings.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported) return 'unsupported';
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (!describeAlerts(current).canPrompt) return toPermission(current);
  return toPermission(await Notifications.requestPermissionsAsync());
}

/** Calls `onOpen` when the user taps a notification of `kind` (or any of several), including one that launched the app. */
export function onNotificationOpened(kind: string | string[], onOpen: () => void): () => void {
  if (!notificationsSupported) return () => {};
  const kinds = Array.isArray(kind) ? kind : [kind];
  const isOurs = (response: Notifications.NotificationResponse | null) =>
    kinds.includes(String(response?.notification.request.content.data?.kind));

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (isOurs(response)) onOpen();
  });
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (isOurs(response)) onOpen();
  });
  return () => subscription.remove();
}

import * as Notifications from 'expo-notifications';

import { COUNTDOWN_STORAGE_KEY, restoreCountdown } from '@/lib/clock';
import {
  type CountdownNotificationPlan,
  formatTimeOfDay,
  planCountdownNotifications,
} from '@/lib/countdownNotifications';
import { loadJson } from '@/lib/storage';
import {
  ChannelId,
  configureNotifications,
  getNotificationPermission,
  NotificationKind,
  notificationsSupported,
  onNotificationOpened,
  requestNotificationPermission,
} from '@/notifications/setup';

/**
 * Applies a CountdownNotificationPlan (src/lib/countdownNotifications.ts). One countdown
 * exists at a time, so each notification has a fixed identifier.
 */
export const COUNTDOWN_ALERT_ID = 'countdown-done';
export const COUNTDOWN_STATUS_ID = 'countdown-status';

// Syncs run one at a time, so quick Pause/Resume/Cancel taps can't interleave and leave
// a stale or duplicate notification behind.
let syncQueue: Promise<unknown> = Promise.resolve();

/**
 * Makes the phone's countdown notifications match `plan`:
 * - First removes the delivered status note and, unless the countdown is at "done", the
 *   completion alert (pending or delivered), so there is never more than one of each,
 *   whatever iOS does with repeated identifiers. At "done" the alert is kept so it can
 *   still fire and play its sound.
 * - Then posts the status note (silent, "passive": no sound and doesn't light the
 *   screen) and schedules the completion alert (sound; "timeSensitive", which iOS may
 *   let through a Focus mode only if the app has that capability and the user allows it).
 * The first countdown start asks for notification permission, or to upgrade provisional
 * (quiet) permission. Without permission nothing is posted; the Clock still works.
 */
export function syncCountdownNotifications(plan: CountdownNotificationPlan): Promise<void> {
  if (!notificationsSupported) return Promise.resolve();
  const run = syncQueue.then(async () => {
    // At "done" the alert is left alone: the app can notice zero a moment before iOS
    // delivers the alert, and cancelling it then would swallow the "Time's up" sound.
    // Cancel and Restart clear it (pending or delivered) as usual.
    if (plan.phase !== 'done') {
      await Notifications.cancelScheduledNotificationAsync(COUNTDOWN_ALERT_ID);
      await Notifications.dismissNotificationAsync(COUNTDOWN_ALERT_ID);
    }
    await Notifications.dismissNotificationAsync(COUNTDOWN_STATUS_ID);
    if (!plan.status && plan.alertAt == null) return;

    await configureNotifications();
    if (plan.alertAt != null) await requestNotificationPermission();
    if ((await getNotificationPermission()) !== 'granted') return;

    if (plan.status) {
      await Notifications.scheduleNotificationAsync({
        identifier: COUNTDOWN_STATUS_ID,
        content: {
          title: plan.status.title,
          body: plan.status.body,
          sound: false,
          interruptionLevel: 'passive',
          data: { kind: NotificationKind.countdownStatus, url: '/clock' },
        },
        trigger: null,
      });
    }
    if (plan.alertAt != null && plan.alertAt > Date.now()) {
      await Notifications.scheduleNotificationAsync({
        identifier: COUNTDOWN_ALERT_ID,
        content: {
          title: 'Time’s up',
          body: 'Your countdown has finished.',
          sound: true,
          interruptionLevel: 'timeSensitive',
          data: { kind: NotificationKind.countdownDone, url: '/clock' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(plan.alertAt),
          channelId: ChannelId.countdown,
        },
      });
    }
  });
  syncQueue = run.catch(() => undefined);
  return run;
}

/**
 * On launch, removes a status note left from a countdown that finished (or was reset)
 * while the app was closed. The Clock tab only mounts when visited, so this runs from
 * the root layout. A running or paused countdown is left for the Clock to manage.
 */
export async function clearStaleCountdownStatus(): Promise<void> {
  if (!notificationsSupported) return;
  const saved = restoreCountdown(await loadJson<unknown>(COUNTDOWN_STORAGE_KEY));
  const phase = saved ? planCountdownNotifications(saved, Date.now(), formatTimeOfDay).phase : 'none';
  if (phase === 'none' || phase === 'done') await Notifications.dismissNotificationAsync(COUNTDOWN_STATUS_ID);
}

/** Calls `onOpen` when the user taps a countdown notification, including one that launched the app. */
export function onCountdownNotificationOpened(onOpen: () => void): () => void {
  return onNotificationOpened([NotificationKind.countdownDone, NotificationKind.countdownStatus], onOpen);
}

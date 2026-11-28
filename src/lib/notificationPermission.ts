/**
 * Pure interpretation of a notification permission response (expo-notifications'
 * NotificationPermissionsStatus), kept free of native imports so it can be unit tested.
 */

export type NotificationPermission = 'granted' | 'undetermined' | 'denied' | 'unsupported';

/** Mirrors expo-notifications' IosAuthorizationStatus. */
export const IosStatus = {
  notDetermined: 0,
  denied: 1,
  authorized: 2,
  provisional: 3,
  ephemeral: 4,
} as const;
/** Mirrors expo-notifications' IosAlertStyle.NONE. */
const IOS_ALERT_STYLE_NONE = 0;

/** The parts of a permission response this module reads. */
export type PermissionSnapshot = {
  granted: boolean;
  canAskAgain: boolean;
  ios?: { status: number; allowsSound: boolean | null; allowsAlert: boolean | null; alertStyle: number };
};

const isProvisional = (r: PermissionSnapshot) =>
  r.ios?.status === IosStatus.provisional || r.ios?.status === IosStatus.ephemeral;

/**
 * Whether notifications can be delivered at all. iOS "provisional" counts as granted:
 * those notifications are delivered, just quietly, so weigh-in reminders keep working.
 */
export function toPermission(r: PermissionSnapshot): NotificationPermission {
  if (r.granted || isProvisional(r)) return 'granted';
  return r.canAskAgain ? 'undetermined' : 'denied';
}

export type AlertIssue = 'not-asked' | 'provisional' | 'denied' | 'alerts-off' | 'sound-off';

export type AlertAudibility = {
  permission: NotificationPermission;
  /** A countdown's "Time's up" will show as an alert with sound (as far as the app can tell). */
  audible: boolean;
  /** Why it won't be audible, or null. */
  issue: AlertIssue | null;
  /**
   * The app can still show the iOS permission prompt: never asked, or only provisional
   * (iOS lets an app ask once to upgrade provisional to full permission).
   */
  canPrompt: boolean;
};

/**
 * Whether alerts will be audible. Provisional permission delivers quietly (Notification
 * Center only: no sound, banner or vibration), so it isn't enough for "Time's up".
 * Focus modes and the Silent switch can still mute an audible alert; apps can't see those.
 */
export function describeAlerts(r: PermissionSnapshot): AlertAudibility {
  const permission = toPermission(r);
  const provisional = isProvisional(r);
  const canPrompt = provisional || (!r.granted && r.canAskAgain);
  let issue: AlertIssue | null = null;
  if (permission === 'denied') issue = 'denied';
  else if (permission === 'undetermined') issue = 'not-asked';
  else if (provisional) issue = 'provisional';
  else if (r.ios && (r.ios.allowsAlert === false || r.ios.alertStyle === IOS_ALERT_STYLE_NONE))
    issue = 'alerts-off';
  else if (r.ios && r.ios.allowsSound === false) issue = 'sound-off';
  return { permission, audible: issue === null, issue, canPrompt };
}

export const UNSUPPORTED_AUDIBILITY: AlertAudibility = {
  permission: 'unsupported',
  audible: false,
  issue: null,
  canPrompt: false,
};

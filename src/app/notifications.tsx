import { useState } from 'react';
import { Linking, StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useAlertAudibility } from '@/hooks/useAlertAudibility';
import { useNow } from '@/hooks/useNow';
import { useReminders } from '@/hooks/useReminders';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { formatReminderHours, nextReminder } from '@/lib/reminders';
import type { AlertAudibility } from '@/lib/notificationPermission';
import { findEntryForDay, todayKey } from '@/lib/weight';
import { requestNotificationPermission } from '@/notifications/setup';
import { spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

/** Notification settings: daily weigh-in reminders and countdown alerts (☰ › Notifications). */
export default function NotificationsScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useAppTheme();
  const reminders = useReminders();
  const { entries } = useWeightEntries();
  const now = useNow();
  const loggedToday = findEntryForDay(entries, todayKey(now)) != null;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const on = reminders.enabled && reminders.permission === 'granted';
  const blocked = reminders.permission === 'denied';
  const next = on ? nextReminder(now, loggedToday) : null;

  async function toggle(value: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      if (!value) {
        await reminders.disable();
      } else {
        const permission = await reminders.enable();
        if (permission === 'denied') {
          setMessage(
            'Notifications are blocked for My Form. Allow them in your phone’s Settings to get reminders.',
          );
        }
      }
    } catch {
      setMessage('Couldn’t change reminders. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function status(): string {
    if (!reminders.supported) return 'Reminders work in the My Form phone app; browsers aren’t supported.';
    if (!on) return 'Reminders are off.';
    if (loggedToday) return 'Today’s weigh-in is logged, so there are no more reminders today.';
    if (!next) return 'No reminders scheduled.';
    const time = next.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return next.toDateString() === now.toDateString()
      ? `Next reminder at ${time}.`
      : `Next reminder tomorrow at ${time}.`;
  }

  return (
    <Screen scroll>
      <Card title="Weigh-in reminders">
        <View style={styles.row}>
          <View style={styles.rowText}>
            <AppText>Daily reminders</AppText>
            <AppText variant="small" tone="muted">
              {formatReminderHours()}, only on days you haven’t logged yet.
            </AppText>
          </View>
          <Switch
            value={on}
            onValueChange={(value) => void toggle(value)}
            disabled={!reminders.supported || !reminders.loaded || busy}
            accessibilityLabel="Daily weigh-in reminders"
            trackColor={{ true: colors.highlight, false: colors.border }}
            thumbColor={on ? colors.onPrimary : undefined}
            // react-native-web colors the "on" thumb with activeThumbColor instead.
            {...{ activeThumbColor: colors.onPrimary }}
          />
        </View>

        <AppText variant="small" tone="muted" accessibilityLiveRegion="polite">
          {status()}
        </AppText>

        {blocked ? (
          <View style={styles.blocked}>
            <AppText variant="small" style={styles.errorText}>
              Notifications are blocked for My Form in your phone’s Settings.
            </AppText>
            <AppButton
              title="Open Settings"
              variant="secondary"
              onPress={() => void Linking.openSettings()}
            />
          </View>
        ) : null}

        {message ? (
          <AppText variant="small" accessibilityRole="alert" style={styles.errorText}>
            {message}
          </AppText>
        ) : null}
      </Card>

      <CountdownAlertsCard />
    </Screen>
  );
}

/** What to say about countdown alerts, and whether a fix is available in the app. */
function countdownAlertText(a: AlertAudibility): { text: string; action: 'ask' | 'settings' | null } {
  if (a.permission === 'unsupported') {
    return {
      text: 'Countdown alerts work in the My Form phone app; browsers aren’t supported.',
      action: null,
    };
  }
  switch (a.issue) {
    case 'not-asked':
      return {
        text: 'Allow notifications to hear “Time’s up” when the app is closed. You’ll also be asked the first time you start a countdown.',
        action: 'ask',
      };
    case 'provisional':
      return {
        text: 'Notifications are delivered quietly, so “Time’s up” makes no sound. Allow full notifications to hear it.',
        action: 'ask',
      };
    case 'denied':
      return {
        text: 'Notifications are off for this app. Turn them on in your iPhone’s Settings › Notifications to hear “Time’s up”.',
        action: 'settings',
      };
    case 'alerts-off':
      return {
        text: 'Alerts are hidden for this app, so “Time’s up” won’t show. Turn on alerts in Settings › Notifications.',
        action: 'settings',
      };
    case 'sound-off':
      return {
        text: 'Sounds are off for this app’s notifications. Turn on Sounds in Settings › Notifications.',
        action: 'settings',
      };
    default:
      return {
        text: '“Time’s up” plays your alert sound when the app is closed, and a running countdown shows its end time on the lock screen. A Focus mode or the Silent switch can still mute it; iOS may let it through a Focus as Time Sensitive if that’s allowed for the app.',
        action: null,
      };
  }
}

/** Countdown alerts: whether "Time's up" will be audible, and how to fix it if not. */
function CountdownAlertsCard() {
  const styles = useThemedStyles(makeStyles);
  const { audibility, refresh } = useAlertAudibility();
  const [note, setNote] = useState<string | null>(null);
  if (!audibility) return null;
  const { text, action } = countdownAlertText(audibility);

  async function allow() {
    setNote(null);
    await requestNotificationPermission();
    const next = await refresh();
    // iOS shows the prompt only once; after that, only Settings can change it.
    if (!next.audible) setNote('Still silent? Open Settings to allow notifications with sound.');
  }

  return (
    <Card title="Countdown alerts">
      <AppText variant="small" tone="muted" accessibilityLiveRegion="polite">
        {text}
      </AppText>
      {action === 'ask' ? (
        <AppButton title="Allow notifications" variant="secondary" onPress={() => void allow()} />
      ) : null}
      {action === 'settings' || note ? (
        <View style={styles.blocked}>
          {note ? (
            <AppText variant="small" tone="muted">
              {note}
            </AppText>
          ) : null}
          <AppButton title="Open Settings" variant="secondary" onPress={() => void Linking.openSettings()} />
        </View>
      ) : null}
    </Card>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    rowText: { flexShrink: 1, gap: 2 },
    blocked: { gap: spacing.sm },
    errorText: { color: c.danger },
  });

import { useState } from 'react';
import { Linking, StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useNow } from '@/hooks/useNow';
import { useReminders } from '@/hooks/useReminders';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { formatReminderHours, nextReminder } from '@/lib/reminders';
import { findEntryForDay, todayKey } from '@/lib/weight';
import { spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

/** Settings for daily weigh-in reminders, opened from the bell on Home. */
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
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    rowText: { flexShrink: 1, gap: 2 },
    blocked: { gap: spacing.sm },
    errorText: { color: c.danger },
  });

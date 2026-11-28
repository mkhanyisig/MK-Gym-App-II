import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ClockButton } from '@/components/ClockButton';
import { ClockFace } from '@/components/ClockFace';
import { DurationPicker } from '@/components/DurationPicker';
import { ProgressRing } from '@/components/ProgressRing';
import { useAlertAudibility } from '@/hooks/useAlertAudibility';
import type { useCountdown } from '@/hooks/useCountdown';
import {
  type DurationParts,
  formatCountdown,
  isValidCountdownMs,
  joinDuration,
  splitDuration,
  spokenDuration,
} from '@/lib/clock';
import { radius, spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

type Props = { countdown: ReturnType<typeof useCountdown> };

const PRESETS = [
  { ms: 30_000, label: '30s' },
  { ms: 60_000, label: '60s' },
  { ms: 90_000, label: '90s' },
];

/** Below this window height Set timer is compact (3 smaller wheel rows, tighter spacing). */
const SHORT_SCREEN_HEIGHT = 700;

/**
 * The countdown, in two views like iOS Clock:
 * - Set timer (idle): hour/minute/second wheels, quick presets, and Start.
 * - Running, paused or finished: the time inside a progress ring, with Cancel and
 *   Pause/Resume (or Restart once finished).
 * Cancel and Restart both keep the chosen duration, so a repeat timer is one tap.
 */
export function CountdownPanel({ countdown }: Props) {
  return countdown.status === 'idle' ? (
    <SetTimer countdown={countdown} />
  ) : (
    <RunningTimer countdown={countdown} />
  );
}

function SetTimer({ countdown }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { height } = useWindowDimensions();
  const compact = height < SHORT_SCREEN_HEIGHT;
  const { durationMs, setDuration, start } = countdown;

  // What the wheels show. It can be 0:00:00 (Start is then disabled), which the
  // countdown itself never holds, so it's kept here rather than in the timer.
  const [parts, setParts] = useState(() => splitDuration(durationMs));
  // Follow the countdown's duration when it changes from elsewhere (the saved timer
  // loading after launch).
  const [syncedDuration, setSyncedDuration] = useState(durationMs);
  if (syncedDuration !== durationMs) {
    setSyncedDuration(durationMs);
    setParts(splitDuration(durationMs));
  }

  const selectedMs = joinDuration(parts);
  const valid = isValidCountdownMs(selectedMs);

  // A valid wheel selection becomes the countdown's duration (and is saved with it).
  useEffect(() => {
    if (valid && selectedMs !== durationMs) setDuration(selectedMs);
  }, [valid, selectedMs, durationMs, setDuration]);

  const onWheel = (part: keyof DurationParts, value: number) => setParts((p) => ({ ...p, [part]: value }));

  const choosePreset = (ms: number) => {
    setParts(splitDuration(ms));
    setDuration(ms);
  };

  return (
    <View style={[styles.view, compact && styles.compact]}>
      <AppText variant="label" tone="muted" style={styles.center} accessibilityRole="header">
        Set timer
      </AppText>

      <DurationPicker value={parts} onChange={onWheel} compact={compact} />

      <View style={styles.presets} role="radiogroup" aria-label="Countdown presets">
        {PRESETS.map(({ ms, label }) => {
          const selected = selectedMs === ms;
          return (
            <Pressable
              key={ms}
              onPress={() => choosePreset(ms)}
              role="radio"
              aria-label={`${spokenDuration(ms)} preset`}
              aria-checked={selected}
              style={({ pressed }) => [
                styles.preset,
                selected && styles.presetSelected,
                pressed && styles.pressed,
              ]}
            >
              <AppText variant="body" style={[styles.presetLabel, selected && styles.presetLabelSelected]}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.buttons}>
        <ClockButton
          label="Cancel"
          icon="close"
          onPress={() => {}}
          disabled
          accessibilityLabel="Cancel countdown"
        />
        <ClockButton
          label="Start"
          icon="play"
          variant="go"
          onPress={start}
          disabled={!valid}
          accessibilityLabel={valid ? `Start countdown, ${spokenDuration(selectedMs)}` : 'Start countdown'}
        />
      </View>
      {!valid ? (
        <AppText variant="small" tone="muted" style={styles.center} accessibilityLiveRegion="polite">
          Choose at least 1 second.
        </AppText>
      ) : null}
    </View>
  );
}

function RunningTimer({ countdown }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { width, height } = useWindowDimensions();
  const { status, durationMs, remainingMs, progress, start, pause, reset } = countdown;
  const done = status === 'done';
  const paused = status === 'paused';

  // As large as fits the width (and short screens), capped for tablets and wide windows.
  const ringSize = Math.round(Math.min(width - spacing.md * 2 - spacing.lg, height * 0.34, 320));
  const statusText = done ? 'Time’s up' : paused ? 'Paused' : '';
  // On a phone where "Time's up" would be silent (or not shown), say so and link to the fix.
  const { audibility } = useAlertAudibility();
  const silent =
    !done && audibility != null && audibility.permission !== 'unsupported' && !audibility.audible;

  return (
    <View style={styles.view}>
      <AppText variant="label" tone="muted" style={styles.center} accessibilityRole="header">
        Countdown
      </AppText>

      <View style={styles.ringArea}>
        <ProgressRing
          progress={progress}
          size={ringSize}
          strokeWidth={Math.max(8, Math.round(ringSize * 0.035))}
          color={colors.progress}
          trackColor={colors.control}
          faded={paused}
        >
          <ClockFace
            text={formatCountdown(remainingMs)}
            size={Math.round(ringSize * 0.24)}
            maxWidth={Math.round(ringSize * 0.78)}
            color={done ? colors.progress : undefined}
            accessibilityLabel={done ? 'Countdown finished' : `${spokenDuration(remainingMs)} remaining`}
          />
          <AppText
            variant="label"
            tone={done ? 'highlight' : 'muted'}
            accessibilityLiveRegion="polite"
            style={styles.status}
          >
            {statusText}
          </AppText>
        </ProgressRing>
      </View>

      <View style={styles.buttons}>
        <ClockButton
          label="Cancel"
          icon="close"
          onPress={reset}
          accessibilityLabel={`Cancel countdown, back to ${spokenDuration(durationMs)}`}
        />
        {status === 'running' ? (
          <ClockButton
            label="Pause"
            icon="pause"
            variant="caution"
            onPress={pause}
            accessibilityLabel="Pause countdown"
          />
        ) : done ? (
          <ClockButton
            label="Restart"
            icon="refresh"
            variant="go"
            onPress={() => {
              reset();
              start();
            }}
            accessibilityLabel={`Restart countdown from ${spokenDuration(durationMs)}`}
          />
        ) : (
          <ClockButton
            label="Resume"
            icon="play"
            variant="go"
            onPress={start}
            accessibilityLabel="Resume countdown"
          />
        )}
      </View>

      {silent ? (
        <Pressable
          onPress={() => router.push('/notifications')}
          accessibilityRole="link"
          accessibilityLabel="Time’s up will be silent. Open notification settings."
          hitSlop={8}
        >
          <AppText variant="small" tone="highlight" style={styles.center}>
            “Time’s up” will be silent when the app is closed · Fix →
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    view: { gap: spacing.md, paddingTop: spacing.md },
    compact: { gap: spacing.sm + 2, paddingTop: spacing.xs },
    center: { textAlign: 'center' },
    ringArea: { alignItems: 'center', paddingVertical: spacing.sm },
    // Sits below the time without pushing it off centre.
    status: { position: 'absolute', bottom: '26%' },
    buttons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
    presets: { flexDirection: 'row', gap: spacing.sm },
    preset: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    presetSelected: { backgroundColor: c.primary, borderColor: c.primary },
    presetLabel: { fontVariant: ['tabular-nums'] },
    presetLabelSelected: { color: c.onPrimary },
    pressed: { opacity: 0.75 },
  });

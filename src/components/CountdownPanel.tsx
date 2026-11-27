import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ClockButton } from '@/components/ClockButton';
import { ClockFace } from '@/components/ClockFace';
import { FormField } from '@/components/FormField';
import type { useCountdown } from '@/hooks/useCountdown';
import { formatCountdown, parseCountdownInput, spokenDuration } from '@/lib/clock';
import { radius, spacing, textVariants, type ThemeColors, useThemedStyles } from '@/theme';

type Props = { countdown: ReturnType<typeof useCountdown> };

const PRESETS_MS = [30_000, 60_000, 90_000];

const fieldsFor = (ms: number) => {
  const total = Math.round(ms / 1000);
  return { minutes: String(Math.floor(total / 60)), seconds: String(total % 60).padStart(2, '0') };
};

/**
 * Countdown controls. The duration (a preset or custom minutes and seconds) can only be
 * changed while the countdown is reset; Reset always returns to the chosen duration.
 */
export function CountdownPanel({ countdown }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { status, durationMs, remainingMs, setDuration, start, pause, reset } = countdown;
  const idle = status === 'idle';
  const done = status === 'done';

  const [fields, setFields] = useState(() => fieldsFor(durationMs));
  const parsed = parseCountdownInput(fields.minutes, fields.seconds);

  const editField = (key: 'minutes' | 'seconds', text: string) => {
    const next = { ...fields, [key]: text };
    setFields(next);
    const result = parseCountdownInput(next.minutes, next.seconds);
    if (result.ok) setDuration(result.durationMs);
  };

  const choosePreset = (ms: number) => {
    setFields(fieldsFor(ms));
    setDuration(ms);
  };

  const statusText = done
    ? 'Time’s up'
    : status === 'running'
      ? 'Running'
      : status === 'paused'
        ? 'Paused'
        : '';

  return (
    <View style={styles.container}>
      <View style={styles.faceArea}>
        <ClockFace
          text={formatCountdown(remainingMs)}
          accessibilityLabel={done ? 'Countdown finished' : `${spokenDuration(remainingMs)} remaining`}
          emphasis={done}
        />
        <AppText
          variant="label"
          tone={done ? 'highlight' : 'muted'}
          accessibilityLiveRegion="polite"
          style={styles.status}
        >
          {statusText}
        </AppText>
      </View>

      <View style={styles.buttons}>
        <ClockButton label="Reset" onPress={reset} disabled={idle} accessibilityLabel="Reset countdown" />
        {status === 'running' ? (
          <ClockButton label="Pause" onPress={pause} accessibilityLabel="Pause countdown" />
        ) : done ? (
          <ClockButton
            label="Restart"
            variant="primary"
            onPress={() => {
              reset();
              start();
            }}
            accessibilityLabel={`Restart countdown from ${spokenDuration(durationMs)}`}
          />
        ) : (
          <ClockButton
            label={status === 'paused' ? 'Resume' : 'Start'}
            variant="primary"
            onPress={start}
            disabled={idle && !parsed.ok}
            accessibilityLabel={status === 'paused' ? 'Resume countdown' : 'Start countdown'}
          />
        )}
      </View>

      <View style={styles.settings}>
        <AppText variant="label" tone="muted" accessibilityRole="header">
          Duration
        </AppText>
        <View style={styles.presets} role="radiogroup" aria-label="Countdown presets">
          {PRESETS_MS.map((ms) => {
            const selected = durationMs === ms;
            return (
              <Pressable
                key={ms}
                onPress={() => choosePreset(ms)}
                disabled={!idle}
                role="radio"
                aria-label={`${spokenDuration(ms)} preset`}
                aria-checked={selected}
                aria-disabled={!idle}
                style={({ pressed }) => [
                  styles.preset,
                  selected && styles.presetSelected,
                  pressed && styles.pressed,
                  !idle && styles.disabled,
                ]}
              >
                <AppText variant="body" style={[styles.presetLabel, selected && styles.presetLabelSelected]}>
                  {formatCountdown(ms)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.custom}>
          <FormField
            flex={1}
            label="Minutes"
            value={fields.minutes}
            onChangeText={(t) => editField('minutes', t)}
            editable={idle}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel="Custom minutes"
          />
          <FormField
            flex={1}
            label="Seconds"
            value={fields.seconds}
            onChangeText={(t) => editField('seconds', t)}
            editable={idle}
            keyboardType="number-pad"
            maxLength={2}
            accessibilityLabel="Custom seconds"
          />
        </View>
        {!parsed.ok && idle ? (
          <AppText variant="small" style={styles.error} accessibilityLiveRegion="polite">
            {parsed.message}
          </AppText>
        ) : !idle ? (
          <AppText variant="small" tone="muted">
            Reset to change the duration.
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.lg },
    faceArea: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.lg },
    // Keeps the layout steady when the status line is empty.
    status: { minHeight: textVariants.label.lineHeight },
    buttons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
    settings: { gap: spacing.sm },
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
    disabled: { opacity: 0.4 },
    custom: { flexDirection: 'row', gap: spacing.md },
    error: { color: c.danger },
  });

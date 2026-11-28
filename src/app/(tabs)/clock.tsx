import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { CountdownPanel } from '@/components/CountdownPanel';
import { FixedDigits } from '@/components/FixedDigits';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StopwatchPanel } from '@/components/StopwatchPanel';
import { useCountdown } from '@/hooks/useCountdown';
import { useStopwatch } from '@/hooks/useStopwatch';
import { formatCountdown, formatStopwatch } from '@/lib/clock';
import { spacing, textVariants, useAppTheme } from '@/theme';

type Mode = 'stopwatch' | 'countdown';

const MODES: { value: Mode; label: string }[] = [
  { value: 'stopwatch', label: 'Stopwatch' },
  { value: 'countdown', label: 'Countdown' },
];

const DEFAULT_COUNTDOWN_MS = 60_000;

/**
 * The Clock tab. Both clocks live here, above the mode switch, so switching modes only
 * changes which one is shown: a running stopwatch or countdown keeps going. Tabs stay
 * mounted, so they also keep going while you use the rest of the app.
 */
export default function ClockScreen() {
  const { colors } = useAppTheme();
  const [mode, setMode] = useState<Mode>('stopwatch');
  const stopwatch = useStopwatch();
  const countdown = useCountdown(DEFAULT_COUNTDOWN_MS);

  // A quiet reminder when the clock you can't see is still going.
  const hidden: { mode: Mode; label: string; time?: string } | null =
    mode === 'stopwatch'
      ? countdown.status === 'done'
        ? { mode: 'countdown', label: 'Countdown finished' }
        : countdown.status === 'running'
          ? { mode: 'countdown', label: 'Countdown running ·', time: formatCountdown(countdown.remainingMs) }
          : null
      : stopwatch.status === 'running'
        ? { mode: 'stopwatch', label: 'Stopwatch running ·', time: formatStopwatch(stopwatch.elapsedMs) }
        : null;

  return (
    <Screen style={styles.container}>
      <SegmentedControl options={MODES} value={mode} onChange={setMode} accessibilityLabel="Clock mode" />

      <View style={styles.body}>
        {mode === 'stopwatch' ? (
          <StopwatchPanel stopwatch={stopwatch} />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <CountdownPanel countdown={countdown} />
          </ScrollView>
        )}
      </View>

      {hidden ? (
        <Pressable
          onPress={() => setMode(hidden.mode)}
          accessibilityRole="button"
          accessibilityLabel={`${hidden.label}${hidden.time ? ` ${hidden.time}` : ''}. Show ${hidden.mode}.`}
          style={styles.hidden}
        >
          <AppText variant="small" tone="highlight">
            {hidden.label}
          </AppText>
          {hidden.time ? (
            <FixedDigits
              text={hidden.time}
              fontSize={13}
              style={[textVariants.small, { color: colors.highlight }]}
            />
          ) : null}
          <AppText variant="small" tone="highlight">
            →
          </AppText>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 560, width: '100%', alignSelf: 'center' },
  body: { flex: 1 },
  scroll: { paddingBottom: spacing.lg },
  hidden: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
});

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { CountdownPanel } from '@/components/CountdownPanel';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StopwatchPanel } from '@/components/StopwatchPanel';
import { useCountdown } from '@/hooks/useCountdown';
import { useStopwatch } from '@/hooks/useStopwatch';
import { formatCountdown, formatStopwatch } from '@/lib/clock';
import { spacing } from '@/theme';

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
  const [mode, setMode] = useState<Mode>('stopwatch');
  const stopwatch = useStopwatch();
  const countdown = useCountdown(DEFAULT_COUNTDOWN_MS);

  // A quiet reminder when the clock you can't see is still going.
  const hidden =
    mode === 'stopwatch'
      ? countdown.status === 'running' || countdown.status === 'done'
        ? {
            mode: 'countdown' as const,
            text:
              countdown.status === 'done'
                ? 'Countdown finished'
                : `Countdown running · ${formatCountdown(countdown.remainingMs)}`,
          }
        : null
      : stopwatch.status === 'running'
        ? { mode: 'stopwatch' as const, text: `Stopwatch running · ${formatStopwatch(stopwatch.elapsedMs)}` }
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
          accessibilityLabel={`${hidden.text}. Show ${hidden.mode}.`}
          style={styles.hidden}
        >
          <AppText variant="small" tone="highlight" style={styles.hiddenText}>
            {hidden.text} →
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
  hidden: { paddingVertical: spacing.sm },
  hiddenText: { textAlign: 'center', fontVariant: ['tabular-nums'] },
});

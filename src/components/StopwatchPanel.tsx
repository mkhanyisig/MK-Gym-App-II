import { FlatList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ClockButton } from '@/components/ClockButton';
import { ClockFace } from '@/components/ClockFace';
import type { useStopwatch } from '@/hooks/useStopwatch';
import { confirm } from '@/lib/confirm';
import { formatStopwatch, spokenDuration } from '@/lib/clock';
import { spacing, type ThemeColors, useThemedStyles } from '@/theme';

type Props = { stopwatch: ReturnType<typeof useStopwatch> };

/**
 * Stopwatch controls, iOS Clock style: the left button is Lap while running and Reset
 * while paused; the right button starts, pauses and resumes. Reset is only offered once
 * paused, and asks first if there are laps to lose.
 */
export function StopwatchPanel({ stopwatch }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { status, elapsedMs, laps, start, pause, lap, reset } = stopwatch;
  const running = status === 'running';
  const paused = status === 'paused';

  const onReset = async () => {
    const completedLaps = laps.length - 1;
    if (completedLaps > 0) {
      const ok = await confirm({
        title: 'Reset stopwatch?',
        message: `This clears the time and ${completedLaps} lap${completedLaps === 1 ? '' : 's'}.`,
        confirmLabel: 'Reset',
        destructive: true,
      });
      if (!ok) return;
    }
    reset();
  };

  return (
    <View style={styles.container}>
      <View style={styles.faceArea}>
        <ClockFace text={formatStopwatch(elapsedMs)} accessibilityLabel={spokenDuration(elapsedMs)} />
        <AppText variant="label" tone="muted">
          {running ? 'Running' : paused ? 'Paused' : 'Ready'}
        </AppText>
      </View>

      <View style={styles.buttons}>
        {paused ? (
          <ClockButton label="Reset" onPress={onReset} accessibilityLabel="Reset stopwatch" />
        ) : (
          <ClockButton label="Lap" onPress={lap} disabled={!running} accessibilityLabel="Record a lap" />
        )}
        {running ? (
          <ClockButton label="Pause" onPress={pause} accessibilityLabel="Pause stopwatch" />
        ) : (
          <ClockButton
            label={paused ? 'Resume' : 'Start'}
            variant="primary"
            onPress={start}
            accessibilityLabel={paused ? 'Resume stopwatch' : 'Start stopwatch'}
          />
        )}
      </View>

      <FlatList
        data={laps}
        keyExtractor={(item) => String(item.number)}
        style={styles.laps}
        accessibilityLabel="Laps"
        renderItem={({ item }) => (
          <View
            style={styles.lapRow}
            accessible
            accessibilityLabel={`Lap ${item.number}, ${spokenDuration(item.durationMs)}`}
          >
            <AppText variant="body" tone="muted">
              Lap {item.number}
            </AppText>
            <AppText variant="body" style={styles.lapTime}>
              {formatStopwatch(item.durationMs)}
            </AppText>
          </View>
        )}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, gap: spacing.lg },
    faceArea: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.lg },
    buttons: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
    laps: { flex: 1, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    lapRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    lapTime: { fontVariant: ['tabular-nums'] },
  });

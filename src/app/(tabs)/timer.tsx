import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { useStopwatch } from '@/hooks/useStopwatch';
import { formatDuration } from '@/lib/format';
import { font, spacing, type ThemeColors, useThemedStyles } from '@/theme';

export default function TimerScreen() {
  const styles = useThemedStyles(makeStyles);
  const { status, elapsed, start, pause, resume, reset } = useStopwatch();

  const primary =
    status === 'idle'
      ? { title: 'Start', onPress: start }
      : status === 'running'
        ? { title: 'Pause', onPress: pause }
        : { title: 'Resume', onPress: resume };

  return (
    <Screen style={styles.container}>
      <Text style={styles.title}>Timed Workout</Text>
      <View style={styles.clockWrap}>
        <Text style={styles.clock} accessibilityRole="timer">
          {formatDuration(elapsed)}
        </Text>
        <Text style={styles.status}>
          {status === 'idle' ? 'Ready' : status === 'running' ? 'Running' : 'Paused'}
        </Text>
      </View>
      <View style={styles.buttons}>
        <AppButton title={primary.title} onPress={primary.onPress} style={styles.button} />
        <AppButton
          title="Reset"
          variant="secondary"
          onPress={reset}
          disabled={status === 'idle'}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { justifyContent: 'space-between' },
    title: { fontSize: font.title, fontWeight: '800', color: c.text },
    clockWrap: { alignItems: 'center', gap: spacing.sm },
    clock: { fontSize: 64, fontWeight: '300', fontVariant: ['tabular-nums'], color: c.text },
    status: { fontSize: font.body, color: c.textMuted },
    buttons: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
    button: { flex: 1 },
  });

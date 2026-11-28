import { StyleSheet, View } from 'react-native';

import { WheelPicker } from '@/components/WheelPicker';
import type { DurationParts } from '@/lib/clock';
import { spacing } from '@/theme';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);
const HOURS = range(24);
const SIXTY = range(60);

const unit = (word: string) => (n: number) => `${n} ${word}${n === 1 ? '' : 's'}`;

type Props = {
  value: DurationParts;
  /** Reports one wheel at a time, so two wheels settling together can't overwrite each other. */
  onChange: (part: keyof DurationParts, value: number) => void;
  /** Short screens: 3 smaller rows instead of 5, so the controls below stay in view. */
  compact?: boolean;
};

/** Hours (0–23), minutes and seconds (0–59) wheels. Any timer can use it. */
export function DurationPicker({ value, onChange, compact = false }: Props) {
  const size = compact
    ? ({ visibleRows: 3, rowHeight: 36 } as const)
    : ({ visibleRows: 5, rowHeight: 44 } as const);
  return (
    <View style={styles.row}>
      <WheelPicker
        values={HOURS}
        value={value.hours}
        onChange={(n) => onChange('hours', n)}
        label="hours"
        spoken={unit('hour')}
        {...size}
      />
      <WheelPicker
        values={SIXTY}
        value={value.minutes}
        onChange={(n) => onChange('minutes', n)}
        label="min"
        spoken={unit('minute')}
        {...size}
      />
      <WheelPicker
        values={SIXTY}
        value={value.seconds}
        onChange={(n) => onChange('seconds', n)}
        label="sec"
        spoken={unit('second')}
        {...size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
});

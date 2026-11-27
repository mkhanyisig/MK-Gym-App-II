import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { spacing } from '@/theme';

type Props = {
  label: string;
  /** Large figure, e.g. "74.8". Omit to show only `children` (an empty state). */
  value?: string;
  unit?: string;
  caption?: string;
  /** Read by screen readers in place of the visual pieces, e.g. "Form. Current weight 74.8 kilograms." */
  accessibilityLabel: string;
  children?: ReactNode;
  style?: ViewStyle;
};

/** A labelled metric: small-caps label, a large serif figure and a caption. */
export function StatBlock({ label, value, unit, caption, accessibilityLabel, children, style }: Props) {
  return (
    <View style={[styles.container, style]} accessible accessibilityLabel={accessibilityLabel}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      {value != null ? (
        <View style={styles.valueRow}>
          <AppText variant="metric">{value}</AppText>
          {unit ? (
            <AppText variant="small" tone="muted">
              {unit}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {caption ? (
        <AppText variant="small" tone="muted">
          {caption}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
});

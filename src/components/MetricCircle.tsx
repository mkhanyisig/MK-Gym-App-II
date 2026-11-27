import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { spacing, useAppTheme } from '@/theme';

export type MetricCircleProps = {
  /** Short name under the circle, e.g. "Weight". */
  label: string;
  /** Figure in the circle. When set, the ring uses the accent colour (real data). */
  value?: string;
  unit?: string;
  /** Neutral icon shown when there's no value yet. */
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** One short line under the label, e.g. "From profile" or "None yet". */
  caption?: string;
  /** Makes the whole metric a link, e.g. to Profile to add a missing value. */
  href?: Href;
  /** What a screen reader says for the whole metric. */
  accessibilityLabel: string;
  size: number;
};

/**
 * One circular metric. Blue ring only for real data; placeholders get a quiet
 * neutral ring and an icon, never a fake value or progress.
 */
export function MetricCircle({ label, value, unit, icon, caption, href, accessibilityLabel, size }: MetricCircleProps) {
  const { colors } = useAppTheme();
  const hasValue = value != null;

  const body = (
    <View style={styles.container}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: hasValue ? 2.5 : 1,
            borderColor: hasValue ? colors.accent : colors.textMuted,
          },
        ]}
      >
        {hasValue ? (
          <>
            <AppText variant="metricSmall" numberOfLines={1} adjustsFontSizeToFit>
              {value}
            </AppText>
            {unit ? (
              <AppText variant="small" tone="muted" style={styles.unit}>
                {unit}
              </AppText>
            ) : null}
          </>
        ) : icon ? (
          <Ionicons name={icon} size={Math.round(size * 0.32)} color={colors.textMuted} />
        ) : null}
      </View>
      <AppText variant="small" style={styles.label} numberOfLines={1}>
        {label}
      </AppText>
      {caption ? (
        <AppText variant="small" tone="muted" style={styles.caption} numberOfLines={1}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <Pressable accessibilityRole="link" accessibilityLabel={accessibilityLabel} style={styles.pressable}>
          {({ pressed }) => <View style={pressed && styles.pressed}>{body}</View>}
        </Pressable>
      </Link>
    );
  }
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.pressable}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: { alignItems: 'center' },
  container: { alignItems: 'center', gap: 2 },
  ring: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unit: { marginTop: -2 },
  label: { marginTop: spacing.xs, textAlign: 'center' },
  caption: { fontSize: 12, lineHeight: 16, textAlign: 'center', marginTop: -2 },
  pressed: { opacity: 0.7 },
});

import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useAppTheme } from '@/theme';

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
  /** Small icon before the caption, e.g. an arrow for a change. Decorative: say it in accessibilityLabel. */
  captionIcon?: ComponentProps<typeof Ionicons>['name'];
  /** Makes the whole metric a link, e.g. to Profile to add a missing value. */
  href?: Href;
  /** What a screen reader says for the whole metric. */
  accessibilityLabel: string;
  size: number;
};

/** Ring thickness: heavier for real data, lighter for placeholders. */
const STROKE_ACTIVE = 5;
const STROKE_NEUTRAL = 3;

/**
 * One gauge-style metric: a 270° ring open at the bottom (like a speedometer),
 * with the label tucked into the opening. Blue only for real data; placeholders
 * get a quiet neutral ring and an icon, never a fake value or progress.
 * (Partial progress fills will need react-native-svg once real data exists.)
 */
export function MetricCircle({
  label,
  value,
  unit,
  icon,
  caption,
  captionIcon,
  href,
  accessibilityLabel,
  size,
}: MetricCircleProps) {
  const { colors } = useAppTheme();
  const hasValue = value != null;

  const stroke = hasValue ? STROKE_ACTIVE : STROKE_NEUTRAL;
  // Scale the figure with the circle so "74.4" fits in the 64pt circles of the 2×2 layout
  // (adjustsFontSizeToFit doesn't shrink text on web). 73pt and larger keep the 22pt style.
  const valueSize = Math.min(22, Math.round(size * 0.3));
  const color = hasValue ? colors.accent : colors.textMuted;
  // Arc ends sit at 135° and 45° below the centre (the open bottom quarter).
  const r = (size - stroke) / 2;
  const endOffset = r * Math.SQRT1_2;
  const capTop = size / 2 + endOffset - stroke / 2;
  // Pull the label up into the opening, just below the arc's ends.
  const labelOverlap = Math.max(0, size - (capTop + stroke) - 2);

  const body = (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: stroke,
              borderColor: color,
              // A transparent bottom side leaves a 90° gap: a gauge, not a closed circle.
              borderBottomColor: 'transparent',
            },
          ]}
        >
          {hasValue ? (
            <>
              <AppText
                variant="metricSmall"
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontSize: valueSize, lineHeight: valueSize + 4 }}
              >
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
        {/* Round caps on both ends of the arc. */}
        {[-1, 1].map((side) => (
          <View
            key={side}
            style={[
              styles.cap,
              {
                width: stroke,
                height: stroke,
                borderRadius: stroke / 2,
                backgroundColor: color,
                top: capTop,
                left: size / 2 + side * endOffset - stroke / 2,
              },
            ]}
          />
        ))}
      </View>
      <AppText variant="small" style={[styles.label, { marginTop: -labelOverlap }]} numberOfLines={1}>
        {label}
      </AppText>
      {caption ? (
        <View style={styles.captionRow}>
          {captionIcon ? <Ionicons name={captionIcon} size={13} color={colors.textMuted} /> : null}
          <AppText variant="small" tone="muted" style={styles.caption} numberOfLines={1}>
            {caption}
          </AppText>
        </View>
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
  cap: { position: 'absolute' },
  unit: { marginTop: -2 },
  label: { textAlign: 'center' },
  // Same size as the label above for readability; no negative margin crowding it.
  captionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  caption: { fontSize: 13, lineHeight: 17, textAlign: 'center' },
  pressed: { opacity: 0.7 },
});

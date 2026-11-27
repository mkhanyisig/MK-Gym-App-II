import { StyleSheet, Text, useWindowDimensions } from 'react-native';

import { fontFamily, type ThemeColors, useThemedStyles } from '@/theme';

type Props = {
  text: string;
  /** Spoken version, e.g. "1 minute 30 seconds". */
  accessibilityLabel: string;
  /** Highlights a finished countdown. */
  emphasis?: boolean;
};

/** The large time display. Tabular figures keep digits from jumping as they change. */
export function ClockFace({ text, accessibilityLabel, emphasis = false }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  // Fits "00:00.00" across small phones; longer "1:02:03.45" gets a little smaller.
  const base = Math.min(76, Math.round(width * 0.19));
  const size = text.length > 8 ? Math.round(base * 0.8) : base;

  return (
    <Text
      accessibilityRole="timer"
      accessibilityLabel={accessibilityLabel}
      numberOfLines={1}
      adjustsFontSizeToFit
      maxFontSizeMultiplier={1}
      style={[
        styles.face,
        { fontSize: size, lineHeight: Math.round(size * 1.15) },
        emphasis && styles.emphasis,
      ]}
    >
      {text}
    </Text>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    face: {
      fontFamily: fontFamily.sans,
      fontVariant: ['tabular-nums'],
      color: c.text,
      textAlign: 'center',
    },
    emphasis: { color: c.highlight },
  });

import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { FixedDigits, fixedDigitsEm } from '@/components/FixedDigits';
import { fontFamily, type ThemeColors, useThemedStyles } from '@/theme';

type Props = {
  text: string;
  /** Spoken version, e.g. "1 minute 30 seconds". */
  accessibilityLabel: string;
  /** Colours the time, e.g. a finished countdown. Defaults to the text colour. */
  color?: string;
  /** Largest font size to use; defaults to 76. */
  size?: number;
  /** Width the time must fit in; defaults to the screen width less the page margins. */
  maxWidth?: number;
};

/**
 * The large time display. Each digit sits in a fixed-width cell (see FixedDigits), so
 * the time stays perfectly still as it counts. The font shrinks only as needed to fit.
 */
export function ClockFace({ text, accessibilityLabel, color, size = 76, maxWidth }: Props) {
  const styles = useThemedStyles(makeStyles);
  const { width } = useWindowDimensions();
  const available = maxWidth ?? width - 40;
  const fontSize = Math.floor(Math.min(size, available / fixedDigitsEm(text)));

  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={accessibilityLabel}>
      <FixedDigits
        text={text}
        fontSize={fontSize}
        style={[styles.face, { lineHeight: Math.round(fontSize * 1.15) }, color != null && { color }]}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    face: { fontFamily: fontFamily.sans, color: c.text },
  });

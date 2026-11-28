import { StyleSheet, Text, type TextStyle, View } from 'react-native';

/** Cell widths in ems: wide enough for Libre Franklin's widest digit ("0", 0.69 em). */
const DIGIT_EM = 0.7;
const SEPARATOR_EM = 0.3;

const cellEm = (ch: string) => (/\d/.test(ch) ? DIGIT_EM : SEPARATOR_EM);

/** Total width of `text` in ems, for sizing it to fit. */
export const fixedDigitsEm = (text: string) => [...text].reduce((sum, ch) => sum + cellEm(ch), 0);

type Props = {
  text: string;
  fontSize: number;
  /** Font, colour and line height; `fontSize` is applied on top. */
  style?: TextStyle | (TextStyle | false | undefined)[];
};

/**
 * Shows a time like "00:24.52" with every character in a fixed-width cell, so changing
 * digits never shift the others. The app's font has proportional figures (a "1" is
 * narrower than a "0") and ignores `tabular-nums` on some platforms, so this keeps
 * timers steady everywhere. Purely visual: give the parent an accessibility label.
 */
export function FixedDigits({ text, fontSize, style }: Props) {
  return (
    <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {[...text].map((ch, i) => (
        <Text
          key={i}
          maxFontSizeMultiplier={1}
          style={[style, { fontSize, width: cellEm(ch) * fontSize }, styles.cell]}
        >
          {ch}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center' },
  cell: { textAlign: 'center' },
});

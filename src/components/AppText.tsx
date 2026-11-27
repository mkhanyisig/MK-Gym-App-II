import { Text, type TextProps } from 'react-native';

import { cappedVariants, textVariants, type TextVariant, useAppTheme } from '@/theme';

type Tone = 'text' | 'muted' | 'highlight';

type Props = TextProps & {
  variant?: TextVariant;
  tone?: Tone;
};

/** Text in one of the My Form. type styles. Extra `style` is applied last. */
export function AppText({ variant = 'body', tone = 'text', style, maxFontSizeMultiplier, ...rest }: Props) {
  const { colors } = useAppTheme();
  const color = tone === 'muted' ? colors.textMuted : tone === 'highlight' ? colors.highlight : colors.text;

  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? (cappedVariants.has(variant) ? 1.3 : undefined)}
      style={[textVariants[variant], { color }, style]}
      {...rest}
    />
  );
}

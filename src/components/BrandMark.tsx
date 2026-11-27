import { Image, type ImageSourcePropType } from 'react-native';

import { useAppTheme } from '@/theme';

/**
 * The My FORM. brand icon, shown beside the wordmark.
 *
 * No asset yet: renders nothing, and the wordmark layout doesn't depend on it.
 * To add it, save a single-colour transparent PNG (≥ 288 px square) as
 * assets/brand/mark.png and set: const MARK = require('../../assets/brand/mark.png');
 * It is tinted from the theme, so one file works in light and dark mode.
 */
const MARK: ImageSourcePropType | null = null;

export function BrandMark({ size = 36 }: { size?: number }) {
  const { colors } = useAppTheme();
  if (!MARK) return null;
  return (
    <Image
      source={MARK}
      style={{ width: size, height: size, tintColor: colors.text }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}

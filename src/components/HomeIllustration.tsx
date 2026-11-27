import { Image } from 'react-native';

/** Square, full-colour artwork with a transparent background (1254 × 1254). */
const ILLUSTRATION = require('../../assets/brand/home-illustration.png');

/**
 * The My Form. Home portrait. Decorative: hidden from screen readers.
 * Keeps its own colours and transparency in both themes; Home decides its size.
 * `contain` keeps the whole figure, graph and dumbbell visible.
 */
export function HomeIllustration({ size }: { size: number }) {
  return (
    <Image
      source={ILLUSTRATION}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      accessibilityIgnoresInvertColors
    />
  );
}

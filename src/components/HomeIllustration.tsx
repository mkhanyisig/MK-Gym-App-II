import { Image, useWindowDimensions } from 'react-native';

import { spacing } from '@/theme';

/** Square, full-colour artwork with a transparent background (1254 × 1254). */
const ILLUSTRATION = require('../../assets/brand/home-illustration.png');

/** Matches the Home page's maximum content width. */
const MAX_CONTENT_WIDTH = 560;

/**
 * Size for the Home illustration: about a third of the content width, so it sits
 * beside the greeting without pushing Begin Session down, and smaller on short screens.
 * 320 pt wide → ~100, 375 → ~120, 430 → ~140, tablets → 168 at most.
 */
export function useHomeIllustrationSize(): number {
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width - spacing.md * 2, MAX_CONTENT_WIDTH);
  return Math.round(Math.max(88, Math.min(contentWidth * 0.36, height * 0.19, 168)));
}

/**
 * The My FORM. Home illustration. Decorative: hidden from screen readers.
 * Kept separate from BrandMark, which is a small single-colour icon tinted by the
 * theme; this artwork keeps its own colours and transparency in both themes.
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

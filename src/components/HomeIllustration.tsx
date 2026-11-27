import { Image, useWindowDimensions } from 'react-native';

import { spacing } from '@/theme';

/** Square, full-colour artwork with a transparent background (1254 × 1254). */
const ILLUSTRATION = require('../../assets/brand/home-illustration.png');

/** Matches the Home page's maximum content width. */
const MAX_CONTENT_WIDTH = 560;

/**
 * Size for the centred Home portrait: just over half the content width, limited by
 * screen height so short phones still reach Begin Session with a short scroll,
 * but never so small it stops being the centrepiece.
 * 320×568 → 150, 375×667 → 162, 390×844 → ~205, 430×932 → ~226, tablets → 240 at most.
 */
export function useHomeIllustrationSize(): number {
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width - spacing.md * 2, MAX_CONTENT_WIDTH);
  return Math.round(Math.max(150, Math.min(contentWidth * 0.58, height * 0.243, 240)));
}

/**
 * The My Form. Home portrait. Decorative: hidden from screen readers.
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

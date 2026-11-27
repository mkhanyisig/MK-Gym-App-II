import { BodoniModa_400Regular } from '@expo-google-fonts/bodoni-moda/400Regular';
import { BodoniModa_400Regular_Italic } from '@expo-google-fonts/bodoni-moda/400Regular_Italic';
import { BodoniModa_600SemiBold } from '@expo-google-fonts/bodoni-moda/600SemiBold';
import { LibreFranklin_400Regular } from '@expo-google-fonts/libre-franklin/400Regular';
import { LibreFranklin_500Medium } from '@expo-google-fonts/libre-franklin/500Medium';
import { LibreFranklin_600SemiBold } from '@expo-google-fonts/libre-franklin/600SemiBold';
import { StintUltraCondensed_400Regular } from '@expo-google-fonts/stint-ultra-condensed/400Regular';
import type { TextStyle } from 'react-native';

/**
 * My Form. type, borrowed from mkhanyisi.xyz:
 * - Stint Ultra Condensed: the wordmark only.
 * - Bodoni Moda: large editorial headings and metrics (never below ~20pt; its hairlines break up).
 * - Libre Franklin: controls, labels, body copy and small values.
 *
 * Each face is its own family, so weight comes from the family name. Never set
 * `fontWeight` alongside these; Android would synthesize or pick the wrong face.
 */
export const fontFamily = {
  display: 'StintUltraCondensed_400Regular',
  serif: 'BodoniModa_400Regular',
  serifItalic: 'BodoniModa_400Regular_Italic',
  serifBold: 'BodoniModa_600SemiBold',
  sans: 'LibreFranklin_400Regular',
  sansMedium: 'LibreFranklin_500Medium',
  sansSemiBold: 'LibreFranklin_600SemiBold',
} as const;

/** Passed to `useFonts` once, at the root. */
export const fontAssets = {
  [fontFamily.display]: StintUltraCondensed_400Regular,
  [fontFamily.serif]: BodoniModa_400Regular,
  [fontFamily.serifItalic]: BodoniModa_400Regular_Italic,
  [fontFamily.serifBold]: BodoniModa_600SemiBold,
  [fontFamily.sans]: LibreFranklin_400Regular,
  [fontFamily.sansMedium]: LibreFranklin_500Medium,
  [fontFamily.sansSemiBold]: LibreFranklin_600SemiBold,
};

export type TextVariant =
  | 'wordmark'
  | 'display'
  | 'metric'
  | 'metricSmall'
  | 'title'
  | 'greeting'
  | 'body'
  | 'small'
  | 'label'
  | 'button';

export const textVariants: Record<TextVariant, TextStyle> = {
  // Mixed case: the brand is written "My Form."
  wordmark: { fontFamily: fontFamily.display, fontSize: 76, lineHeight: 78, letterSpacing: 1 },
  display: { fontFamily: fontFamily.serif, fontSize: 32, lineHeight: 38 },
  metric: { fontFamily: fontFamily.serifBold, fontSize: 36, lineHeight: 42 },
  /** Figures inside metric circles. */
  metricSmall: { fontFamily: fontFamily.serifBold, fontSize: 22, lineHeight: 26 },
  title: { fontFamily: fontFamily.serif, fontSize: 26, lineHeight: 32 },
  greeting: { fontFamily: fontFamily.serifItalic, fontSize: 22, lineHeight: 30 },
  body: { fontFamily: fontFamily.sans, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: fontFamily.sans, fontSize: 13, lineHeight: 19 },
  label: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
};

/** Large type that would wrap or clip if scaled freely with the system text size. */
export const cappedVariants: ReadonlySet<TextVariant> = new Set([
  'wordmark',
  'metric',
  'metricSmall',
  'display',
]);

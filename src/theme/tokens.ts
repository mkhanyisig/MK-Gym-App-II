/**
 * Semantic color tokens, inspired by mkhanyisi.xyz: warm ivory and dark ink
 * by day, charcoal and muted ivory by night, with a muted brass highlight.
 * Every foreground/background pairing used in the app meets WCAG AA.
 */
export type ThemeColors = {
  /** Screen background. */
  background: string;
  /** Cards, inputs, list rows, tab bar, headers. */
  surface: string;
  text: string;
  /** Labels, placeholders, secondary copy. */
  textMuted: string;
  border: string;
  /** Primary actions, screen accents, active tab. */
  primary: string;
  /** Text and icons on `primary`. */
  onPrimary: string;
  /** Links, switch track, highlighted values. */
  highlight: string;
  danger: string;
  /** Text and icons on `danger`. */
  onDanger: string;
};

export type ColorScheme = 'light' | 'dark';

export const palettes: Record<ColorScheme, ThemeColors> = {
  light: {
    background: '#FFF8F0',
    surface: '#FBF1E4',
    text: '#1F1A15',
    textMuted: '#6B6157',
    border: '#E8DCCD',
    primary: '#1F1A15',
    onPrimary: '#FFF8F0',
    highlight: '#7A5C30',
    danger: '#9E3B2F',
    onDanger: '#FFF8F0',
  },
  dark: {
    background: '#121214',
    surface: '#1C1C1F',
    text: '#ECE9E4',
    textMuted: '#9B9893',
    border: '#2A2A2E',
    primary: '#ECE9E4',
    onPrimary: '#121214',
    highlight: '#C8A56A',
    danger: '#D9796B',
    onDanger: '#121214',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 };

export const font = {
  title: 28,
  heading: 20,
  body: 16,
  small: 13,
};

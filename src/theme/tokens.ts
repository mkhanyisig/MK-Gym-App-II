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
  /** Drop shadow for floating surfaces (menus). */
  shadow: string;
  /**
   * Electric blue for metrics with real data or progress (rings, indicators).
   * Used sparingly; placeholders use `textMuted` instead.
   */
  accent: string;
  /** Brand burgundy (matched to the portrait's shorts), behind the My FORM title. Same in both modes. */
  brand: string;
  /** Text on `brand`. */
  onBrand: string;
  /**
   * Accent text on `brand`, contrasting with `onBrand`: the title's full stop and tagline
   * share it so they always match. Must stay readable as small text on `brand` (4.5:1).
   * The brand block and its text use the same values in light and dark mode.
   */
  onBrandAccent: string;
  /**
   * Clock action palette (iOS Clock–style): `go` for Start/Resume, `caution` for Pause and
   * a running countdown, `control` for neutral Lap/Reset/Cancel. Each `on*` meets AA on its fill.
   */
  go: string;
  onGo: string;
  caution: string;
  onCaution: string;
  /** Neutral round control fill; its text is `text`. */
  control: string;
  /** The running countdown's progress ring (at least 3:1 on `background`). */
  progress: string;
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
    shadow: '#1F1A15',
    accent: '#2457E6',
    brand: '#8E3A3E',
    onBrand: '#FFF8F0',
    onBrandAccent: '#F0CC85',
    go: '#2B7040',
    onGo: '#FFF8F0',
    caution: '#9E5409',
    onCaution: '#FFF8F0',
    control: '#DCCDB8',
    progress: '#B4600E',
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
    shadow: '#000000',
    accent: '#5B9BFF',
    brand: '#8E3A3E',
    onBrand: '#FFF8F0',
    onBrandAccent: '#F0CC85',
    go: '#24482D',
    onGo: '#8BE39A',
    caution: '#5A3C18',
    onCaution: '#F5B05A',
    control: '#333338',
    progress: '#F2A541',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

/** `xs` is the editorial default for buttons; larger radii remain for cards and inputs. */
export const radius = { xs: 4, sm: 8, md: 12, lg: 20, pill: 999 };

export const font = {
  title: 28,
  heading: 20,
  body: 16,
  small: 13,
};

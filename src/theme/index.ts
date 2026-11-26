import { palettes } from './tokens';

export * from './tokens';
export * from './ThemeProvider';
export * from './useThemedStyles';

/**
 * @deprecated Temporary light-only alias for code not yet migrated to `useAppTheme`.
 * Removed once every screen reads colors from the theme.
 */
export const colors = {
  ...palettes.light,
  accent: palettes.light.primary,
  info: palettes.light.highlight,
};

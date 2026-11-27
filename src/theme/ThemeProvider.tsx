import * as SystemUI from 'expo-system-ui';
import { createContext, type ReactNode, useContext, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { type ColorScheme, palettes, type ThemeColors } from './tokens';

/** 'system' follows the device appearance. */
export type ThemePreference = 'system' | ColorScheme;

type AppTheme = { scheme: ColorScheme; colors: ThemeColors };

const ThemeContext = createContext<AppTheme | null>(null);

/**
 * Resolves the active color scheme and shares its tokens.
 * `preference` is the extension point for a future manual setting; until then
 * the app always follows the system appearance.
 */
export function AppThemeProvider({
  preference = 'system',
  children,
}: {
  preference?: ThemePreference;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const scheme: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const theme = useMemo(() => ({ scheme, colors: palettes[scheme] }), [scheme]);

  // Root view background, so transitions and the keyboard don't flash the wrong color.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Current scheme and color tokens. Named to avoid clashing with expo-router's `useTheme`. */
export function useAppTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useAppTheme must be used inside <AppThemeProvider>');
  return theme;
}

import * as SystemUI from 'expo-system-ui';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { loadJson, saveJson } from '@/lib/storage';

import { type ColorScheme, palettes, type ThemeColors } from './tokens';

/** 'system' follows the device appearance. */
export type ThemePreference = 'system' | ColorScheme;

type AppTheme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const STORAGE_KEY = 'settings.theme.v1';
const isPreference = (v: unknown): v is ThemePreference => v === 'system' || v === 'light' || v === 'dark';

const ThemeContext = createContext<AppTheme | null>(null);

/** Resolves the active color scheme from the saved preference and the device appearance. */
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadJson<unknown>(STORAGE_KEY).then((saved) => {
      if (isPreference(saved)) setPreferenceState(saved);
      setLoaded(true);
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    saveJson(STORAGE_KEY, next).catch((e) => console.warn('Failed to save theme preference', e));
  }, []);

  // Native controls (alerts, pickers, switches) follow the app's choice too.
  // react-native-web has no override, so the app resolves the scheme itself below.
  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
    }
  }, [preference]);

  const system = useColorScheme();
  const scheme: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const theme = useMemo(
    () => ({ scheme, colors: palettes[scheme], preference, setPreference }),
    [scheme, preference, setPreference],
  );

  // Root view background, so transitions and the keyboard don't flash the wrong color.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  // Wait for the saved preference so the app doesn't flash the wrong theme on launch.
  if (!loaded) return null;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Current scheme, color tokens and theme preference. Named to avoid clashing with expo-router's `useTheme`. */
export function useAppTheme(): AppTheme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useAppTheme must be used inside <AppThemeProvider>');
  return theme;
}

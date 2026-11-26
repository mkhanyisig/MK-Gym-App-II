import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { AppThemeProvider, useAppTheme } from '@/theme';

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ThemedNavigation />
    </AppThemeProvider>
  );
}

function ThemedNavigation() {
  const { scheme, colors } = useAppTheme();

  // Navigation chrome (headers, tab bar, modal) reads these colors.
  const navigationTheme = useMemo<Theme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [scheme, colors]);

  return (
    <ThemeProvider value={navigationTheme}>
      {/* Explicit rather than 'auto' so it follows the app's scheme, even with a future manual preference. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: 'About' }} />
      </Stack>
    </ThemeProvider>
  );
}

import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';

import { ReminderSync } from '@/components/ReminderSync';
import { DatabaseProvider } from '@/db/DatabaseProvider';
import { AppThemeProvider, fontAssets, useAppTheme } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  // Wait for the brand fonts to avoid a flash of system type. If they fail, carry on
  // with system fonts rather than showing a blank screen.
  if (!fontsLoaded && !fontError) return null;

  return (
    <AppThemeProvider>
      {/* Inside the theme so a database error screen is themed too. */}
      <DatabaseProvider>
        <ThemedNavigation />
      </DatabaseProvider>
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
      {/* Explicit rather than 'auto' so it follows the app's scheme, including a manual preference. */}
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
        {/* The title names the tabs for back buttons ("My Form, back") instead of "(tabs)". */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'My Form' }} />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: 'About' }} />
        {/* Opened from the ☰ menu on any tab, so the back button is just the arrow. */}
        <Stack.Screen
          name="settings"
          options={{ title: 'Settings', headerBackButtonDisplayMode: 'minimal' }}
        />
        <Stack.Screen name="weight" options={{ title: 'Weight', headerBackTitle: 'Home' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile', headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen
          name="notifications"
          options={{ title: 'Notifications', headerBackButtonDisplayMode: 'minimal' }}
        />
      </Stack>
      {/* Keeps scheduled weigh-in reminders in step with weigh-ins and the app's lifecycle. */}
      <ReminderSync />
    </ThemeProvider>
  );
}

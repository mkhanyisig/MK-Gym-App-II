import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { MenuButton } from '@/components/MenuButton';
import { useAppTheme } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />;
  };
}

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        // A slim header on every tab holds the app menu; screens keep their own titles.
        headerTitle: '',
        headerLeft: () => <MenuButton />,
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      {/* Home shows the menu beside its title instead of in a header bar. */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerShown: false, tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen name="workouts" options={{ title: 'Workouts', tabBarIcon: tabIcon('barbell') }} />
      <Tabs.Screen name="clock" options={{ title: 'Clock', tabBarIcon: tabIcon('stopwatch') }} />
      {/* Profile lives in the ☰ menu (src/app/profile.tsx). */}
      <Tabs.Screen name="form" options={{ title: 'Form', tabBarIcon: tabIcon('stats-chart') }} />
    </Tabs>
  );
}

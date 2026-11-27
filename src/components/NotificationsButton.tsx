import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useReminders } from '@/hooks/useReminders';
import { spacing, useAppTheme } from '@/theme';

/** Home's bell: opens the Notifications screen. Shows a crossed-out bell while reminders are off. */
export function NotificationsButton() {
  const { colors } = useAppTheme();
  const { enabled, permission } = useReminders();
  const on = enabled && permission === 'granted';

  return (
    // router.push rather than <Link asChild>, which drops the Pressable's style on web.
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={`Notifications. Weigh-in reminders are ${on ? 'on' : 'off'}.`}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons
        name={on ? 'notifications-outline' : 'notifications-off-outline'}
        size={24}
        color={colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Lines up under the ☰ menu button.
  button: { padding: spacing.xs, marginLeft: spacing.sm },
  pressed: { opacity: 0.6 },
});

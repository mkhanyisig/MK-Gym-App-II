import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { textVariants, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

export type ClockButtonVariant = 'go' | 'caution' | 'neutral';

type Props = {
  label: string;
  onPress: () => void;
  /** `go` for Start/Resume/Restart, `caution` for Pause, `neutral` for Lap, Reset and Cancel. */
  variant?: ClockButtonVariant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  /** Spoken label, e.g. "Start stopwatch". */
  accessibilityLabel: string;
};

/**
 * A large round timer control in the spirit of the iOS Clock app. It knows nothing about
 * timing, so any timer (stopwatch, countdown, future rest timers) can use it.
 */
export function ClockButton({
  label,
  onPress,
  variant = 'neutral',
  icon,
  disabled,
  accessibilityLabel,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const fg = variant === 'go' ? colors.onGo : variant === 'caution' ? colors.onCaution : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon ? <Ionicons name={icon} size={22} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
  );
}

const SIZE = 84;

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    go: { backgroundColor: c.go },
    caution: { backgroundColor: c.caution },
    neutral: { backgroundColor: c.control },
    pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
    disabled: { opacity: 0.4 },
    label: { ...textVariants.button, fontSize: 12, letterSpacing: 1 },
  });

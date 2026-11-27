import { Pressable, StyleSheet, Text } from 'react-native';

import { textVariants, type ThemeColors, useThemedStyles } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  /** `primary` for Start/Resume, `neutral` for Pause, Lap and Reset. */
  variant?: 'primary' | 'neutral';
  disabled?: boolean;
  /** Spoken label, e.g. "Start stopwatch". */
  accessibilityLabel: string;
};

/** A large round Clock control, in the spirit of the iOS Clock app. */
export function ClockButton({ label, onPress, variant = 'neutral', disabled, accessibilityLabel }: Props) {
  const styles = useThemedStyles(makeStyles);
  const primary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.primary : styles.neutral,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, primary ? styles.primaryLabel : styles.neutralLabel]}>{label}</Text>
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
    },
    primary: { backgroundColor: c.primary },
    neutral: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    pressed: { opacity: 0.75 },
    disabled: { opacity: 0.35 },
    label: { ...textVariants.button, letterSpacing: 1 },
    primaryLabel: { color: c.onPrimary },
    neutralLabel: { color: c.text },
  });

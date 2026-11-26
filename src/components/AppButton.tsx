import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
};

export function AppButton({ title, onPress, variant = 'primary', disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, variant === 'secondary' && styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  text: { color: '#fff', fontSize: font.body, fontWeight: '600' },
  secondaryText: { color: colors.text },
});

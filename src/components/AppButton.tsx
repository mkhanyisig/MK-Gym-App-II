import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { font, radius, spacing, type ThemeColors, useThemedStyles } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
};

export function AppButton({ title, onPress, variant = 'primary', disabled, style }: Props) {
  const styles = useThemedStyles(makeStyles);

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
      <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    base: {
      paddingVertical: spacing.md - 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    primary: { backgroundColor: c.primary },
    secondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    danger: { backgroundColor: c.danger },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.4 },
    text: { fontSize: font.body, fontWeight: '600' },
    primaryText: { color: c.onPrimary },
    secondaryText: { color: c.text },
    dangerText: { color: c.onDanger },
  });

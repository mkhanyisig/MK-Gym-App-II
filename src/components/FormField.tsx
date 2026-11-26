import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { font, radius, spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  suffix?: string;
  flex?: number;
};

export function FormField({ label, suffix, flex, ...inputProps }: Props) {
  const { scheme, colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.field, flex != null && { flex }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          keyboardAppearance={scheme}
          selectionColor={colors.highlight}
          style={styles.input}
          {...inputProps}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    field: { gap: spacing.xs },
    label: { fontSize: font.small, fontWeight: '600', color: c.textMuted },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md - 4,
    },
    input: { flex: 1, paddingVertical: spacing.sm + 2, fontSize: font.body, color: c.text },
    suffix: { fontSize: font.body, color: c.textMuted, marginLeft: spacing.xs },
  });

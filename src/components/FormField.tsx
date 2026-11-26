import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  suffix?: string;
  flex?: number;
};

export function FormField({ label, suffix, flex, ...inputProps }: Props) {
  return (
    <View style={[styles.field, flex != null && { flex }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          {...inputProps}
        />
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { fontSize: font.small, fontWeight: '600', color: colors.textMuted },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md - 4,
  },
  input: { flex: 1, paddingVertical: spacing.sm + 2, fontSize: font.body, color: colors.text },
  suffix: { fontSize: font.body, color: colors.textMuted, marginLeft: spacing.xs },
});

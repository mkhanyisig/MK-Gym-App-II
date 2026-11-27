import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { font, radius, spacing, type ThemeColors, useThemedStyles } from '@/theme';

export function Card({ title, children, style }: { title?: string; children: ReactNode; style?: ViewStyle }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    title: { fontSize: font.heading, fontWeight: '700', color: c.text },
  });

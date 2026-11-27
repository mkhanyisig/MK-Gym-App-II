import type { ReactNode } from 'react';
import { type LayoutChangeEvent, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, type ThemeColors, useThemedStyles } from '@/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  /** Scroll mode only: reports the visible (viewport) size of the scroll area. */
  onLayout?: (event: LayoutChangeEvent) => void;
};

export function Screen({ children, scroll = false, style, onLayout }: Props) {
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          onLayout={onLayout}
          contentContainerStyle={[styles.content, style]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    fill: { flex: 1 },
    content: { padding: spacing.md, gap: spacing.md },
  });

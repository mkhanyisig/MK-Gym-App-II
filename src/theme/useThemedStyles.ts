import { useMemo } from 'react';

import { useAppTheme } from './ThemeProvider';
import type { ThemeColors } from './tokens';

/**
 * Builds styles from the current theme colors, recomputed only when the theme changes.
 * Define the factory at module scope: `const makeStyles = (c: ThemeColors) => StyleSheet.create({...})`.
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useAppTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}

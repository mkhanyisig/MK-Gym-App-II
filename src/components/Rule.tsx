import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme';

/** A hairline divider between editorial sections. */
export function Rule({ style }: { style?: ViewStyle }) {
  const { colors } = useAppTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }, style]} />;
}

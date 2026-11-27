import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { spacing } from '@/theme';

type Props = {
  message: string;
  action?: { label: string; href: Href };
};

/** A quiet one-line message for sections with no data yet, with an optional next step. */
export function EmptyState({ message, action }: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="small" tone="muted">
        {message}
      </AppText>
      {action ? (
        <Link href={action.href} style={styles.link}>
          <AppText variant="small" tone="highlight">
            {action.label} →
          </AppText>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  link: { paddingVertical: 10, marginVertical: -10 },
});

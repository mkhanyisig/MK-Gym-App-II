import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';

type Props = {
  title: string;
  action?: { label: string; href: Href };
};

/** A letter-spaced small-caps section label with an optional link on the right. */
export function SectionHeader({ title, action }: Props) {
  return (
    <View style={styles.row}>
      <AppText variant="label" tone="muted" accessibilityRole="header">
        {title}
      </AppText>
      {action ? (
        <Link href={action.href} style={styles.action}>
          <AppText variant="label" tone="highlight">
            {action.label} →
          </AppText>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 },
  // Pad the link so it's an easy tap target without changing the visual rhythm.
  action: { paddingVertical: 12, marginVertical: -12, paddingLeft: 12 },
});

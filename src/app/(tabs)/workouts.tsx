import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { sampleWorkouts, type WorkoutLog } from '@/data/sampleWorkouts';
import { formatDate } from '@/lib/format';
import { font, radius, spacing, type ThemeColors, useThemedStyles } from '@/theme';

function WorkoutRow({ item }: { item: WorkoutLog }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{item.title}</Text>
      <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
    </View>
  );
}

export default function WorkoutsScreen() {
  const styles = useThemedStyles(makeStyles);
  return (
    <Screen>
      <Text style={styles.title}>Workout Log</Text>
      <FlatList
        data={sampleWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <WorkoutRow item={item} />}
        contentContainerStyle={styles.list}
        style={styles.flex}
      />
      <AppButton title="Add workout" onPress={() => router.navigate('/timer')} />
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    title: { fontSize: font.title, fontWeight: '800', color: c.text },
    list: { gap: spacing.sm, paddingBottom: spacing.sm },
    row: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderLeftWidth: 4,
      borderLeftColor: c.primary,
      padding: spacing.md,
      gap: 2,
    },
    rowTitle: { fontSize: font.heading, fontWeight: '600', color: c.text },
    rowDate: { fontSize: font.small, color: c.textMuted },
  });

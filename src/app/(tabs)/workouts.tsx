import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { sampleWorkouts, type WorkoutLog } from '@/data/sampleWorkouts';
import { formatDate } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';

function WorkoutRow({ item }: { item: WorkoutLog }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{item.title}</Text>
      <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
    </View>
  );
}

export default function WorkoutsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Workout Log</Text>
      <FlatList
        data={sampleWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={WorkoutRow}
        contentContainerStyle={styles.list}
        style={styles.flex}
      />
      <AppButton title="Add workout" onPress={() => router.navigate('/timer')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: font.title, fontWeight: '800', color: colors.text },
  list: { gap: spacing.sm, paddingBottom: spacing.sm },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    padding: spacing.md,
    gap: 2,
  },
  rowTitle: { fontSize: font.heading, fontWeight: '600', color: colors.text },
  rowDate: { fontSize: font.small, color: colors.textMuted },
});

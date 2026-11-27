import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { formatDate } from '@/lib/format';
import { formatWeight, type UnitSystem } from '@/lib/units';
import type { WeightEntry } from '@/lib/weight';
import { spacing, type ThemeColors, useThemedStyles } from '@/theme';

type Props = {
  entry: WeightEntry;
  units: UnitSystem;
  isToday: boolean;
  /** This row is the one being edited in the form above. */
  isEditing: boolean;
  disabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

/** One weigh-in in the history list, with its own Edit and Delete actions. */
export function WeightEntryRow({ entry, units, isToday, isEditing, disabled, onEdit, onDelete }: Props) {
  const styles = useThemedStyles(makeStyles);
  const weight = formatWeight(entry.weightKg, units);
  const date = formatDate(entry.date);
  const spokenEntry = `${isToday ? 'Today, ' : ''}${date}, ${weight?.spoken ?? ''}`;

  return (
    <View style={[styles.row, isEditing && styles.rowEditing]}>
      <View style={styles.details} accessible accessibilityLabel={spokenEntry}>
        <AppText variant="small" tone="muted">
          {isToday ? `Today · ${date}` : date}
        </AppText>
        <AppText style={styles.weight}>
          {weight?.value} {weight?.unit}
        </AppText>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Edit weigh-in: ${spokenEntry}`}
          style={({ pressed }) => [styles.action, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <AppText variant="label" tone="highlight">
            Edit
          </AppText>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Delete weigh-in: ${spokenEntry}`}
          style={({ pressed }) => [styles.action, pressed && styles.pressed, disabled && styles.disabled]}
        >
          <AppText variant="label" style={styles.deleteLabel}>
            Delete
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    rowEditing: { borderBottomColor: c.highlight },
    details: { flexShrink: 1, gap: 2 },
    weight: { fontSize: 18, lineHeight: 24 },
    actions: { flexDirection: 'row' },
    // 44pt-tall tap targets without making the row look heavy.
    action: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
    deleteLabel: { color: c.danger },
    pressed: { opacity: 0.6 },
    disabled: { opacity: 0.4 },
  });

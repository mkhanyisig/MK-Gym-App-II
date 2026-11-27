import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Rule } from '@/components/Rule';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { WeightEntryRow } from '@/components/WeightEntryRow';
import { WeightForm } from '@/components/WeightForm';
import { WeightEntryError } from '@/db/weightEntries';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { confirm } from '@/lib/confirm';
import { formatDate } from '@/lib/format';
import { formatWeight } from '@/lib/units';
import { findEntryForDay, planWeightSave, todayKey, type WeightEntry } from '@/lib/weight';
import { spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

type Feedback = { kind: 'success' | 'error'; message: string } | null;

/** A user-facing message for a failed write. Never claims success. */
function failureMessage(error: unknown, action: string): string {
  if (error instanceof WeightEntryError) return error.message;
  return `Couldn’t ${action}. Nothing was changed — please try again.`;
}

export default function WeightScreen() {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useAppTheme();
  const { profile } = useProfile();
  const units = profile.units;
  const { entries, loading, error, refresh, logWeight, updateWeight, deleteWeight } = useWeightEntries();

  const today = todayKey(useNow());
  const todayEntry = findEntryForDay(entries, today);
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  /** "74.8 kg" / "165 lbs" in the user's units. */
  const label = (kg: number) => {
    const weight = formatWeight(kg, units);
    return weight ? `${weight.value} ${weight.unit}` : '';
  };

  // The entry the form currently prefills: the one being edited, else today's.
  const target = editing ?? todayEntry;

  async function save(weightKg: number) {
    const plan = planWeightSave({ weightKg, today, entries, editing, units });
    setFeedback(null);

    if (plan.kind === 'unchanged') {
      setEditing(null);
      setFeedback({ kind: 'success', message: `No change — still ${label(plan.existing.weightKg)}.` });
      return;
    }
    if (plan.kind === 'replace') {
      const ok = await confirm({
        title: 'Replace today’s weigh-in?',
        message: `Today is logged as ${label(plan.existing.weightKg)}. Replace it with ${label(plan.weightKg)}?`,
        confirmLabel: 'Replace',
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
      if (plan.kind === 'update') {
        await updateWeight(plan.existing.id, { weightKg: plan.weightKg });
        setEditing(null);
        setFeedback({
          kind: 'success',
          message: `Updated ${formatDate(plan.existing.date)} to ${label(plan.weightKg)}.`,
        });
      } else {
        // create and replace both upsert today's row (replace keeps its id and created_at).
        await logWeight(today, plan.weightKg);
        setFeedback({ kind: 'success', message: `Saved ${label(plan.weightKg)} for today.` });
      }
    } catch (e) {
      setFeedback({ kind: 'error', message: failureMessage(e, 'save your weigh-in') });
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: WeightEntry) {
    const ok = await confirm({
      title: 'Delete this weigh-in?',
      message: `${formatDate(entry.date)}: ${label(entry.weightKg)}. This can’t be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    setSaving(true);
    setFeedback(null);
    try {
      await deleteWeight(entry.id);
      if (editing?.id === entry.id) setEditing(null);
      setFeedback({ kind: 'success', message: `Deleted the weigh-in for ${formatDate(entry.date)}.` });
    } catch (e) {
      setFeedback({ kind: 'error', message: failureMessage(e, 'delete that weigh-in') });
    } finally {
      setSaving(false);
    }
  }

  const unitWord = units === 'metric' ? 'kilograms' : 'pounds';
  const firstLoad = loading && entries.length === 0;

  return (
    <Screen scroll>
      {/* Log or edit */}
      <View style={styles.section}>
        <AppText variant="title" accessibilityRole="header">
          {editing ? 'Edit weigh-in' : 'Log weight'}
        </AppText>
        <AppText variant="small" tone="muted">
          {editing ? formatDate(editing.date) : `Today · ${formatDate(today)}`}
        </AppText>

        {!editing && todayEntry ? (
          <AppText variant="small" tone="highlight">
            Logged today: {label(todayEntry.weightKg)}. Saving a new value replaces it.
          </AppText>
        ) : null}

        <WeightForm
          // Reset the input when what it edits, its saved value, or the units change.
          key={`${target?.id ?? 'new'}-${target?.updatedAt ?? ''}-${units}`}
          units={units}
          initialWeightKg={target?.weightKg ?? null}
          submitLabel={
            editing ? 'Save changes' : todayEntry ? 'Update today’s weight' : 'Save today’s weight'
          }
          inputLabel={
            editing
              ? `Weight for ${formatDate(editing.date)} in ${unitWord}`
              : `Today’s weight in ${unitWord}`
          }
          saving={saving}
          onSubmit={(kg) => void save(kg)}
          onInvalid={(message) => setFeedback({ kind: 'error', message })}
          onCancel={
            editing
              ? () => {
                  setEditing(null);
                  setFeedback(null);
                }
              : undefined
          }
        />

        {feedback ? (
          <AppText
            variant="small"
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={feedback.kind === 'error' ? styles.errorText : styles.successText}
          >
            {feedback.message}
          </AppText>
        ) : null}
      </View>

      <Rule />

      {/* History */}
      <View style={styles.section}>
        <SectionHeader title="Recent" />
        {error ? (
          <View style={styles.readError} accessibilityRole="alert">
            <AppText variant="small" style={styles.errorText}>
              Couldn’t load your weigh-ins{entries.length ? '; showing the last ones loaded' : ''}.
            </AppText>
            <AppButton title="Try again" variant="secondary" onPress={() => void refresh()} />
          </View>
        ) : null}

        {firstLoad ? (
          <ActivityIndicator color={colors.textMuted} accessibilityLabel="Loading weigh-ins" />
        ) : entries.length === 0 && !error ? (
          <EmptyState message="No weigh-ins yet. Log your first one above." />
        ) : (
          <View>
            {entries.map((entry) => (
              <WeightEntryRow
                key={entry.id}
                entry={entry}
                units={units}
                isToday={entry.date === today}
                isEditing={editing?.id === entry.id}
                disabled={saving}
                onEdit={() => {
                  setEditing(entry);
                  setFeedback(null);
                }}
                onDelete={() => void remove(entry)}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    readError: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingLeft: spacing.sm,
      borderLeftWidth: 2,
      borderLeftColor: c.danger,
    },
    errorText: { color: c.danger },
    successText: { color: c.textMuted },
  });

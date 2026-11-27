import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { confirm } from '@/lib/confirm';
import { formatDate } from '@/lib/format';
import { formatWeight, type UnitSystem } from '@/lib/units';
import { canImportProfileWeight, todayKey, type WeightEntry } from '@/lib/weight';
import { spacing, type ThemeColors, useThemedStyles } from '@/theme';

type Props = {
  units: UnitSystem;
  latest: WeightEntry | null;
  /** The saved Profile weight (not unsaved edits), used for the optional import. */
  profileWeightKg: number | null;
  weighInsLoaded: boolean;
  weighInsError: Error | null;
  entryCount: number;
  logWeight: (date: string, weightKg: number) => Promise<WeightEntry>;
};

type Feedback = { kind: 'success' | 'error'; message: string } | null;

/**
 * Where Profile's weight comes from, plus a link to log one. With a weigh-in it shows
 * the latest entry and its day (the weight field is hidden elsewhere). Without, the
 * Profile weight field is the fallback, and if it has a value the user can choose to
 * log it as today's weigh-in after confirming (never automatic, never backdated).
 */
export function ProfileWeight({
  units,
  latest,
  profileWeightKg,
  weighInsLoaded,
  weighInsError,
  entryCount,
  logWeight,
}: Props) {
  const styles = useThemedStyles(makeStyles);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const label = (kg: number) => {
    const weight = formatWeight(kg, units);
    return weight ? `${weight.value} ${weight.unit}` : '';
  };

  const canImport = canImportProfileWeight({ profileWeightKg, weighInsLoaded, entryCount });

  async function importProfileWeight() {
    if (profileWeightKg == null) return;
    const today = todayKey();
    const ok = await confirm({
      title: 'Log your Profile weight as today’s weigh-in?',
      message: `${label(profileWeightKg)} will be saved as your weigh-in for today (${formatDate(today)}). Your Profile weight stays as it is.`,
      confirmLabel: 'Log weigh-in',
    });
    if (!ok) return;
    setSaving(true);
    setFeedback(null);
    try {
      await logWeight(today, profileWeightKg);
      setFeedback({ kind: 'success', message: `Saved ${label(profileWeightKg)} as today’s weigh-in.` });
    } catch {
      setFeedback({
        kind: 'error',
        message: 'Couldn’t save the weigh-in. Nothing was changed — please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      {latest ? (
        <View
          accessible
          accessibilityLabel={`Current weight, ${formatWeight(latest.weightKg, units)?.spoken}, logged ${formatDate(latest.date)}`}
        >
          <AppText variant="small" tone="muted">
            Current weight
          </AppText>
          <AppText style={styles.weight}>{label(latest.weightKg)}</AppText>
          <AppText variant="small" tone="muted">
            Latest weigh-in · {formatDate(latest.date)}
          </AppText>
        </View>
      ) : (
        <AppText variant="small" tone="muted">
          {weighInsError
            ? 'Couldn’t load your weigh-ins, so your Profile weight is used for now.'
            : 'No weigh-ins yet, so your Profile weight below is used. Log weigh-ins to track changes over time.'}
        </AppText>
      )}

      <Link
        href="/weight"
        style={styles.link}
        accessibilityRole="link"
        accessibilityLabel="Log weight. Opens your weigh-ins."
      >
        <AppText variant="label" tone="highlight">
          Log weight →
        </AppText>
      </Link>

      {canImport ? (
        <AppButton
          title={saving ? 'Saving…' : 'Log Profile weight as today’s weigh-in'}
          variant="secondary"
          onPress={() => void importProfileWeight()}
          disabled={saving}
        />
      ) : null}

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
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.sm },
    weight: { fontSize: 22, lineHeight: 28 },
    link: { alignSelf: 'flex-start', paddingVertical: 12, marginVertical: -8 },
    errorText: { color: c.danger },
    successText: { color: c.textMuted },
  });

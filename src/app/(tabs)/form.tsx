import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Rule } from '@/components/Rule';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { useProfile } from '@/hooks/useProfile';
import { useWeightEntries } from '@/hooks/useWeightEntries';
import { bmiCategory, calculateBmi } from '@/lib/bmi';
import { formatDate } from '@/lib/format';
import { formatWeight, formatWeightChange } from '@/lib/units';
import { currentWeight, weightChange } from '@/lib/weight';
import { spacing, useAppTheme } from '@/theme';

/** One figure with its label and a short note, e.g. WEIGHT / 74.8 kg / Logged Nov 23. */
function Stat({
  label,
  value,
  unit,
  note,
  spoken,
}: Record<'label' | 'value' | 'note' | 'spoken', string> & {
  unit?: string;
}) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={spoken}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="metric">
        {value}
        {unit ? <AppText variant="body" tone="muted">{` ${unit}`}</AppText> : null}
      </AppText>
      <AppText variant="small" tone="muted">
        {note}
      </AppText>
    </View>
  );
}

/**
 * The Form tab: a plain summary of the body metrics the app already records. It only
 * shows real data (weigh-ins, the Profile weight and height) and says what's missing
 * otherwise. Charts and training metrics come later.
 */
export default function FormScreen() {
  const { colors } = useAppTheme();
  const { profile, loading } = useProfile();
  const weighIns = useWeightEntries();

  // Wait for weigh-ins too, so the Profile fallback never flashes up first.
  if (loading || (!weighIns.loaded && !weighIns.error)) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const units = profile.units;
  const current = currentWeight(weighIns.latest, profile.weightKg);
  const weight = current.source === 'none' ? null : formatWeight(current.weightKg, units);
  const change = weightChange(weighIns.latest, weighIns.previous);
  const formattedChange = change ? formatWeightChange(change.deltaKg, units) : null;
  const bmi = calculateBmi(current.source === 'none' ? null : current.weightKg, profile.heightCm);

  return (
    <Screen scroll style={styles.page}>
      <View style={styles.heading}>
        <AppText variant="display" accessibilityRole="header">
          Form
        </AppText>
        <AppText variant="body" tone="muted">
          Where your body metrics stand today.
        </AppText>
      </View>

      <SectionHeader title="Body" action={{ label: 'Weigh-ins', href: '/weight' }} />

      {weighIns.error ? (
        <EmptyState
          message="Your weigh-ins couldn’t be loaded."
          action={{ label: 'Try again in Weigh-ins', href: '/weight' }}
        />
      ) : null}

      {weight ? (
        <Stat
          label="Weight"
          value={weight.value}
          unit={weight.unit}
          note={current.source === 'weigh-in' ? `Logged ${formatDate(current.date)}` : 'From your profile'}
          spoken={`Weight, ${weight.spoken}, ${
            current.source === 'weigh-in' ? `logged ${formatDate(current.date)}` : 'from your profile'
          }`}
        />
      ) : (
        <EmptyState message="No weight recorded yet." action={{ label: 'Log a weigh-in', href: '/weight' }} />
      )}

      <Rule />

      {change && formattedChange ? (
        <Stat
          label="Change"
          value={formattedChange.direction === 'same' ? 'No change' : formattedChange.value}
          unit={formattedChange.direction === 'same' ? undefined : formattedChange.unit}
          note={`Since ${formatDate(change.sinceDate)}`}
          spoken={`Change, ${formattedChange.spoken} since ${formatDate(change.sinceDate)}`}
        />
      ) : (
        <View style={styles.stat}>
          <AppText variant="label" tone="muted">
            Change
          </AppText>
          <EmptyState message="Log two weigh-ins to see how your weight is changing." />
        </View>
      )}

      <Rule />

      {bmi != null ? (
        <Stat
          label="BMI"
          value={bmi.toFixed(1)}
          note={bmiCategory(bmi)}
          spoken={`Body mass index, ${bmi.toFixed(1)}, ${bmiCategory(bmi)}`}
        />
      ) : (
        <View style={styles.stat}>
          <AppText variant="label" tone="muted">
            BMI
          </AppText>
          <EmptyState
            message={
              profile.heightCm == null
                ? 'Add your height in Profile to see your BMI.'
                : 'Log your weight to see your BMI.'
            }
            action={
              profile.heightCm == null
                ? { label: 'Open Profile', href: '/profile' }
                : { label: 'Log a weigh-in', href: '/weight' }
            }
          />
        </View>
      )}

      <View style={styles.section}>
        <SectionHeader title="Training" />
        <EmptyState message="Training metrics will appear here once workout logging arrives." />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  page: { maxWidth: 560, width: '100%', alignSelf: 'center', gap: spacing.md, paddingBottom: spacing.xl },
  heading: { gap: spacing.xs, marginBottom: spacing.sm },
  stat: { gap: spacing.xs },
  section: { gap: spacing.md, marginTop: spacing.md },
});

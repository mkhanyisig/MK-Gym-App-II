import type { MetricCircleProps } from '@/components/MetricCircle';
import { formatDate } from '@/lib/format';
import { formatWeight, formatWeightChange, type UnitSystem } from '@/lib/units';
import { currentWeight, weightChange, type WeightEntry } from '@/lib/weight';

type Metric = Omit<MetricCircleProps, 'size'>;

type Input = {
  latest: WeightEntry | null;
  previous: WeightEntry | null;
  profileWeightKg: number | null;
  units: UnitSystem;
  /** The first weigh-in read has succeeded. */
  loaded: boolean;
  /** A weigh-in read failed. */
  error: Error | null;
};

const base = { label: 'Weight', href: '/weight' } as const;

/**
 * The Home "Weight" gauge. Uses the single current-weight rule (latest weigh-in, else
 * the Profile weight marked "From profile", else empty). It shows a change only between
 * two recorded weigh-ins (never against the undated Profile weight), as a signed value
 * rather than a color. Until weigh-ins load it shows a neutral placeholder, so the
 * Profile fallback never flashes up before the real latest weigh-in.
 */
export function weightMetric({ latest, previous, profileWeightKg, units, loaded, error }: Input): Metric {
  if (!loaded) {
    return error
      ? {
          ...base,
          icon: 'scale-outline',
          caption: 'Unavailable',
          accessibilityLabel: 'Weight couldn’t be loaded. Opens your weigh-ins to try again.',
        }
      : { ...base, icon: 'scale-outline', caption: 'Loading', accessibilityLabel: 'Weight, loading.' };
  }

  const current = currentWeight(latest, profileWeightKg);
  if (current.source === 'none') {
    return {
      ...base,
      icon: 'scale-outline',
      caption: 'Add yours',
      accessibilityLabel: 'Weight, not set. Opens your weigh-ins to log one.',
    };
  }

  const weight = formatWeight(current.weightKg, units);
  if (!weight) throw new Error('A current weight always formats');

  if (current.source === 'profile') {
    return {
      ...base,
      value: weight.value,
      unit: weight.unit,
      caption: 'From profile',
      accessibilityLabel: `Weight from your profile, ${weight.spoken}. Opens your weigh-ins.`,
    };
  }

  const change = weightChange(latest, previous);
  const formatted = change ? formatWeightChange(change.deltaKg, units) : null;
  const changeSpoken =
    change && formatted ? `, ${formatted.spoken} since ${formatDate(change.sinceDate)}` : '';
  return {
    ...base,
    value: weight.value,
    unit: weight.unit,
    caption: formatted
      ? formatted.direction === 'same'
        ? 'No change'
        : `${formatted.value} ${formatted.unit}`
      : undefined,
    accessibilityLabel: `Weight, ${weight.spoken}${changeSpoken}. Opens your weigh-ins.`,
  };
}

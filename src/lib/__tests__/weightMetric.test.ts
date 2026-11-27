import { calculateBmi } from '@/lib/bmi';
import { currentWeight, type WeightEntry } from '@/lib/weight';
import { weightMetric } from '@/lib/weightMetric';

const entry = (date: string, weightKg: number, id = 1): WeightEntry => ({
  id,
  date,
  weightKg,
  createdAt: 'x',
  updatedAt: 'x',
});

const ready = { loaded: true, error: null, units: 'metric' as const };

describe('Home weight gauge', () => {
  it('shows a neutral placeholder while weigh-ins load, never the Profile fallback', () => {
    const metric = weightMetric({
      latest: null,
      previous: null,
      profileWeightKg: 80,
      units: 'metric',
      loaded: false,
      error: null,
    });
    expect(metric).toMatchObject({ caption: 'Loading', icon: 'scale-outline' });
    expect(metric.value).toBeUndefined();
  });

  it('says it is unavailable if the first read failed', () => {
    const metric = weightMetric({
      latest: null,
      previous: null,
      profileWeightKg: 80,
      units: 'metric',
      loaded: false,
      error: new Error('x'),
    });
    expect(metric).toMatchObject({ caption: 'Unavailable', href: '/weight' });
  });

  it('keeps the existing empty state when there is no weight at all', () => {
    expect(weightMetric({ ...ready, latest: null, previous: null, profileWeightKg: null })).toMatchObject({
      caption: 'Add yours',
      accessibilityLabel: 'Weight, not set. Opens your weigh-ins to log one.',
    });
  });

  it('shows the Profile weight marked "From profile" when there are no weigh-ins', () => {
    expect(weightMetric({ ...ready, latest: null, previous: null, profileWeightKg: 74.84274 })).toMatchObject(
      {
        value: '74.8',
        unit: 'kg',
        caption: 'From profile',
        accessibilityLabel: 'Weight from your profile, 74.8 kilograms. Opens your weigh-ins.',
      },
    );
  });

  it('shows the latest weigh-in, ignoring the Profile weight, with a dash and "First log" for a single entry', () => {
    const metric = weightMetric({
      ...ready,
      latest: entry('2026-11-27', 74.2),
      previous: null,
      profileWeightKg: 80,
    });
    expect(metric).toMatchObject({
      value: '74.2',
      unit: 'kg',
      href: '/weight',
      caption: 'First log',
      captionIcon: 'remove',
      accessibilityLabel:
        'Weight, 74.2 kilograms, first weigh-in, no change to report yet. Opens your weigh-ins.',
    });
  });

  it('shows the signed change between the two latest weigh-ins', () => {
    const metric = weightMetric({
      ...ready,
      latest: entry('2026-11-27', 74.2),
      previous: entry('2026-11-24', 74.8),
      profileWeightKg: 80,
    });
    expect(metric.caption).toBe('−0.6 kg');
    expect(metric.captionIcon).toBe('arrow-down');
    expect(metric.accessibilityLabel).toMatch(
      /^Weight, 74\.2 kilograms, down 0\.6 kilograms since .+\. Opens your weigh-ins\.$/,
    );
  });

  it('says "No change" when the two latest round to the same value', () => {
    const metric = weightMetric({
      ...ready,
      latest: entry('2026-11-27', 74.21),
      previous: entry('2026-11-26', 74.2),
      profileWeightKg: null,
    });
    expect(metric).toMatchObject({ caption: 'No change', captionIcon: 'remove' });
  });

  it('converts the value and the change for imperial', () => {
    const metric = weightMetric({
      ...ready,
      units: 'imperial',
      latest: entry('2026-11-27', 74.84274),
      previous: entry('2026-11-24', 75.29633),
      profileWeightKg: null,
    });
    expect(metric).toMatchObject({ value: '165', unit: 'lbs', caption: '−1 lbs' });
  });
});

describe('BMI uses the current-weight rule', () => {
  const bmiFor = (latest: WeightEntry | null, profileWeightKg: number | null) => {
    const current = currentWeight(latest, profileWeightKg);
    return calculateBmi(current.source === 'none' ? null : current.weightKg, 180);
  };

  it('uses the latest weigh-in when there is one', () => {
    expect(bmiFor(entry('2026-11-27', 81), 64.8)).toBeCloseTo(25, 5);
  });

  it('uses the Profile weight only when there are no weigh-ins', () => {
    expect(bmiFor(null, 64.8)).toBeCloseTo(20, 5);
  });

  it('has no BMI without any weight', () => {
    expect(bmiFor(null, null)).toBeNull();
  });
});

describe('Home weight gauge arrow', () => {
  it('points up for a gain', () => {
    const metric = weightMetric({
      ...ready,
      latest: entry('2026-11-27', 75.4),
      previous: entry('2026-11-26', 75),
      profileWeightKg: null,
    });
    expect(metric).toMatchObject({ caption: '+0.4 kg', captionIcon: 'arrow-up' });
  });

  it('shows a dash, not an arrow, when unchanged or with a single weigh-in', () => {
    const unchanged = { latest: entry('2026-11-27', 75), previous: entry('2026-11-26', 75) };
    expect(weightMetric({ ...ready, ...unchanged, profileWeightKg: null }).captionIcon).toBe('remove');
    expect(
      weightMetric({ ...ready, latest: entry('2026-11-27', 75), previous: null, profileWeightKg: null })
        .captionIcon,
    ).toBe('remove');
  });

  it('keeps "From profile" (no dash) for the Profile fallback', () => {
    const metric = weightMetric({ ...ready, latest: null, previous: null, profileWeightKg: 80 });
    expect(metric.caption).toBe('From profile');
    expect(metric.captionIcon).toBeUndefined();
  });
});

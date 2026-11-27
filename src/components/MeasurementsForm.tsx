import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormField } from '@/components/FormField';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
  parseNumber,
  round,
  type UnitSystem,
} from '@/lib/units';
import { spacing } from '@/theme';

type Props = {
  units: UnitSystem;
  weightKg: number | null;
  heightCm: number | null;
  onChange: (next: { weightKg: number | null; heightCm: number | null }) => void;
};

const str = (n: number | null) => (n == null ? '' : String(n));

/**
 * Edits weight/height in the selected unit system while reporting metric values.
 * Text state is local so partially typed numbers ("72.") aren't clobbered;
 * it is initialised from props once, so the parent should change `key` to
 * re-sync (e.g. when the unit system changes or a profile is loaded/cleared).
 */
export function MeasurementsForm({ units, weightKg, heightCm, onChange }: Props) {
  const initialFeetInches = heightCm == null ? null : cmToFeetInches(heightCm);
  const [weight, setWeight] = useState(() =>
    str(weightKg == null ? null : round(units === 'metric' ? weightKg : kgToLbs(weightKg))),
  );
  const [height, setHeight] = useState(() => str(heightCm == null ? null : round(heightCm)));
  const [feet, setFeet] = useState(() => str(initialFeetInches?.feet ?? null));
  const [inches, setInches] = useState(() => str(initialFeetInches?.inches ?? null));

  const updateWeight = (text: string) => {
    setWeight(text);
    const n = parseNumber(text);
    onChange({ weightKg: n == null ? null : units === 'metric' ? n : lbsToKg(n), heightCm });
  };

  const updateHeightCm = (text: string) => {
    setHeight(text);
    onChange({ weightKg, heightCm: parseNumber(text) });
  };

  const updateFeetInches = (nextFeet: string, nextInches: string) => {
    setFeet(nextFeet);
    setInches(nextInches);
    const f = parseNumber(nextFeet);
    const i = parseNumber(nextInches) ?? 0;
    onChange({ weightKg, heightCm: f == null ? null : feetInchesToCm(f, i) });
  };

  return (
    <View style={styles.container}>
      <FormField
        label="Weight"
        suffix={units === 'metric' ? 'kg' : 'lbs'}
        value={weight}
        onChangeText={updateWeight}
        keyboardType="decimal-pad"
        placeholder={units === 'metric' ? 'e.g. 75' : 'e.g. 165'}
      />
      {units === 'metric' ? (
        <FormField
          label="Height"
          suffix="cm"
          value={height}
          onChangeText={updateHeightCm}
          keyboardType="decimal-pad"
          placeholder="e.g. 180"
        />
      ) : (
        <View style={styles.row}>
          <FormField
            flex={1}
            label="Height"
            suffix="ft"
            value={feet}
            onChangeText={(t) => updateFeetInches(t, inches)}
            keyboardType="number-pad"
            placeholder="5"
          />
          <FormField
            flex={1}
            label=" "
            suffix="in"
            value={inches}
            onChangeText={(t) => updateFeetInches(feet, t)}
            keyboardType="decimal-pad"
            placeholder="10"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
});

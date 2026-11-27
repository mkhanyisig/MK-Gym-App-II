import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { FormField } from '@/components/FormField';
import { formatWeight, parseWeightInput, type UnitSystem } from '@/lib/units';
import { spacing } from '@/theme';

type Props = {
  units: UnitSystem;
  /** Prefills the input (e.g. today's weight, or the entry being edited). */
  initialWeightKg: number | null;
  submitLabel: string;
  /** Spoken label for the input, e.g. "Today's weight in kilograms". */
  inputLabel: string;
  saving: boolean;
  /** Called with a valid weight in kg; validation messages are reported via onInvalid. */
  onSubmit: (weightKg: number) => void;
  onInvalid: (message: string) => void;
  onCancel?: () => void;
};

/**
 * The weight input and its buttons. It keeps the typed text locally, so a partly typed
 * "74." isn't clobbered; the screen changes its `key` to reset it (new entry being
 * edited, units switched, value saved).
 */
export function WeightForm({
  units,
  initialWeightKg,
  submitLabel,
  inputLabel,
  saving,
  onSubmit,
  onInvalid,
  onCancel,
}: Props) {
  const [text, setText] = useState(() => formatWeight(initialWeightKg, units)?.value ?? '');
  const unit = units === 'metric' ? 'kg' : 'lbs';

  const submit = () => {
    const parsed = parseWeightInput(text, units);
    if (parsed.ok) onSubmit(parsed.weightKg);
    else onInvalid(parsed.message);
  };

  return (
    <View style={styles.container}>
      <FormField
        label="Weight"
        suffix={unit}
        value={text}
        onChangeText={setText}
        keyboardType="decimal-pad"
        placeholder={units === 'metric' ? 'e.g. 74.8' : 'e.g. 165'}
        accessibilityLabel={inputLabel}
        returnKeyType="done"
        onSubmitEditing={submit}
        editable={!saving}
      />
      <AppButton title={saving ? 'Saving…' : submitLabel} onPress={submit} disabled={saving} />
      {onCancel ? (
        <AppButton title="Cancel" variant="secondary" onPress={onCancel} disabled={saving} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
});

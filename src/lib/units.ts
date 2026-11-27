const KG_PER_LB = 0.45359237;
const CM_PER_INCH = 2.54;

export type UnitSystem = 'metric' | 'imperial';

export const kgToLbs = (kg: number) => kg / KG_PER_LB;
export const lbsToKg = (lbs: number) => lbs * KG_PER_LB;

/** Splits a height into feet and inches, with inches to one decimal (180 cm → 5 ft 10.9 in). */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  // Round once on the total so 11.96 in becomes the next foot, never "5 ft 12 in".
  const tenthsOfInch = Math.round((cm / CM_PER_INCH) * 10);
  return { feet: Math.floor(tenthsOfInch / 120), inches: (tenthsOfInch % 120) / 10 };
}

export const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * CM_PER_INCH;

/** Parse a user-typed number; empty or invalid input becomes null. */
export function parseNumber(text: string): number | null {
  const n = Number.parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export const round = (n: number, digits = 1) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

export type FormattedWeight = {
  /** The figure to display, e.g. "74.8" or "165" (one decimal, trailing ".0" dropped). */
  value: string;
  unit: 'kg' | 'lbs';
  /** For screen readers, e.g. "74.8 kilograms". */
  spoken: string;
};

/**
 * Displays a canonical kilogram weight in the user's units. Weights are always stored
 * in kg; this is the one place that converts and rounds them for display.
 * Returns null when there's no weight.
 */
export function formatWeight(weightKg: number | null, units: UnitSystem): FormattedWeight | null {
  if (weightKg == null) return null;
  const metric = units === 'metric';
  const value = String(round(metric ? weightKg : kgToLbs(weightKg)));
  return metric
    ? { value, unit: 'kg', spoken: `${value} kilograms` }
    : { value, unit: 'lbs', spoken: `${value} pounds` };
}

export type WeightInput =
  { ok: true; weightKg: number } | { ok: false; reason: 'empty' | 'invalid'; message: string };

/**
 * Parses a weight typed in the user's units into canonical kg (the input counterpart
 * of formatWeight). Accepts a comma decimal. Rejects empty, non-numeric, zero and
 * negative values with a message the UI can show.
 */
export function parseWeightInput(text: string, units: UnitSystem): WeightInput {
  if (text.trim() === '') return { ok: false, reason: 'empty', message: 'Enter your weight.' };
  const value = parseNumber(text);
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return { ok: false, reason: 'invalid', message: 'Enter a weight above zero, like 74.8.' };
  }
  return { ok: true, weightKg: units === 'metric' ? value : lbsToKg(value) };
}

export type FormattedWeightChange = {
  /** Signed figure with a true minus sign, e.g. "−0.6" or "+0.4"; "0" when unchanged. */
  value: string;
  unit: 'kg' | 'lbs';
  direction: 'down' | 'up' | 'same';
  /** For screen readers, e.g. "down 0.6 kilograms". */
  spoken: string;
};

/**
 * Displays a weight difference (in kg) in the user's units with an explicit sign, so
 * gain and loss don't depend on color. Rounds like formatWeight; a change that rounds
 * to zero reads as no change.
 */
export function formatWeightChange(deltaKg: number, units: UnitSystem): FormattedWeightChange {
  const magnitude = formatWeight(Math.abs(deltaKg), units) ?? { value: '0', unit: 'kg' as const, spoken: '' };
  const unitWord = magnitude.unit === 'kg' ? 'kilograms' : 'pounds';
  if (magnitude.value === '0') {
    return { value: '0', unit: magnitude.unit, direction: 'same', spoken: 'no change' };
  }
  const direction = deltaKg < 0 ? 'down' : 'up';
  return {
    value: `${direction === 'down' ? '−' : '+'}${magnitude.value}`,
    unit: magnitude.unit,
    direction,
    spoken: `${direction} ${magnitude.value} ${unitWord}`,
  };
}

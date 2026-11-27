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

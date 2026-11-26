export type BmiCategory = 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese';

/** BMI from metric values. Returns null when inputs are missing or invalid. */
export function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

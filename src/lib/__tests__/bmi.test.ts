import { bmiCategory, calculateBmi } from '@/lib/bmi';

describe('calculateBmi', () => {
  it('computes weight / height² in metric', () => {
    expect(calculateBmi(75, 180)).toBeCloseTo(23.15, 2);
  });

  it('returns null when a measurement is missing or not positive', () => {
    expect(calculateBmi(null, 180)).toBeNull();
    expect(calculateBmi(75, null)).toBeNull();
    expect(calculateBmi(0, 180)).toBeNull();
    expect(calculateBmi(75, -1)).toBeNull();
  });
});

describe('bmiCategory', () => {
  it.each([
    [18.4, 'Underweight'],
    [18.5, 'Normal weight'],
    [24.9, 'Normal weight'],
    [25, 'Overweight'],
    [29.9, 'Overweight'],
    [30, 'Obese'],
  ])('%p → %s', (bmi, category) => {
    expect(bmiCategory(bmi)).toBe(category);
  });
});

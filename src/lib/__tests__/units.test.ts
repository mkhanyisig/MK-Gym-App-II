import {
  cmToFeetInches,
  feetInchesToCm,
  formatWeight,
  kgToLbs,
  lbsToKg,
  parseNumber,
  parseWeightInput,
  round,
} from '@/lib/units';

describe('kg ↔ lbs', () => {
  it('uses the exact international pound', () => {
    expect(lbsToKg(1)).toBe(0.45359237);
    expect(kgToLbs(0.45359237)).toBeCloseTo(1, 12);
  });

  it('round-trips without drift', () => {
    expect(lbsToKg(kgToLbs(74.8))).toBeCloseTo(74.8, 10);
  });
});

describe('cmToFeetInches', () => {
  it('keeps one decimal of inches', () => {
    expect(cmToFeetInches(180)).toEqual({ feet: 5, inches: 10.9 });
  });

  it('rolls 11.96 in over into the next foot instead of showing 12 in', () => {
    // 182.8 cm = 71.97 in → 72.0 in after rounding → 6 ft 0 in.
    expect(cmToFeetInches(182.8)).toEqual({ feet: 6, inches: 0 });
  });

  it('round-trips with feetInchesToCm to within rounding', () => {
    const { feet, inches } = cmToFeetInches(177.8);
    expect(feetInchesToCm(feet, inches)).toBeCloseTo(177.8, 1);
  });
});

describe('parseNumber', () => {
  it('accepts a comma as the decimal separator', () => {
    expect(parseNumber('72,5')).toBe(72.5);
  });

  it('returns null for empty or non-numeric input', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });

  it('keeps a partially typed number', () => {
    expect(parseNumber('72.')).toBe(72);
  });
});

describe('round', () => {
  it('defaults to one decimal', () => {
    expect(round(74.84274)).toBe(74.8);
  });

  it('accepts other precisions', () => {
    expect(round(177.84, 0)).toBe(178);
    expect(round(74.84274, 2)).toBe(74.84);
  });
});

describe('formatWeight', () => {
  it('shows metric weights in kg, rounded to one decimal', () => {
    expect(formatWeight(74.84274, 'metric')).toEqual({ value: '74.8', unit: 'kg', spoken: '74.8 kilograms' });
  });

  it('converts to lbs for imperial', () => {
    // 74.84274 kg is exactly 165 lbs; whole numbers drop the trailing ".0".
    expect(formatWeight(74.84274, 'imperial')).toEqual({ value: '165', unit: 'lbs', spoken: '165 pounds' });
  });

  it('rounds half up at the first decimal', () => {
    expect(formatWeight(80.25, 'metric')?.value).toBe('80.3');
  });

  it('returns null when there is no weight', () => {
    expect(formatWeight(null, 'metric')).toBeNull();
    expect(formatWeight(null, 'imperial')).toBeNull();
  });
});

describe('parseWeightInput', () => {
  it('takes metric input as kg', () => {
    expect(parseWeightInput('74.8', 'metric')).toEqual({ ok: true, weightKg: 74.8 });
    expect(parseWeightInput(' 74,8 ', 'metric')).toEqual({ ok: true, weightKg: 74.8 });
  });

  it('converts imperial input to kg at full precision', () => {
    const parsed = parseWeightInput('165', 'imperial');
    expect(parsed).toEqual({ ok: true, weightKg: 165 * 0.45359237 });
    // And it displays back as what was typed.
    expect(parsed.ok && formatWeight(parsed.weightKg, 'imperial')?.value).toBe('165');
  });

  it('asks for a value when the field is empty', () => {
    expect(parseWeightInput('   ', 'metric')).toMatchObject({ ok: false, reason: 'empty' });
  });

  it('rejects non-numbers, zero and negatives with a helpful message', () => {
    for (const bad of ['abc', '0', '-5', '0,0']) {
      expect(parseWeightInput(bad, 'metric')).toMatchObject({
        ok: false,
        reason: 'invalid',
        message: expect.stringContaining('above zero'),
      });
    }
  });
});

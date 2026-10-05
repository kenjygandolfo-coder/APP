// Hand-computed expected values with the 1984 constants:
// - Man (80 kg, 180 cm, 30 y): 88.362 + 1071.76 + 863.82 − 170.31 = 1853.632
// - Woman (60 kg, 165 cm, 25 y): 447.593 + 554.82 + 511.17 − 108.25 = 1405.333

import {
  ACTIVITY_LEVELS,
  ACTIVITY_MULTIPLIERS,
  type ActivityLevel,
  type BmrInput,
  CalculationInputError,
  calculateBmr,
  calculateTdee,
  type TdeeInput,
} from '../domain';

const MALE: BmrInput = { sex: 'male', weightKg: 80, heightCm: 180, ageYears: 30 };
const FEMALE: BmrInput = { sex: 'female', weightKg: 60, heightCm: 165, ageYears: 25 };
const MALE_BMR = 1853.632;
const FEMALE_BMR = 1405.333;
const PRECISION = 3;

describe('calculateBmr (revised Harris-Benedict, 1984)', () => {
  it('computes BMR for a man', () => {
    expect(calculateBmr(MALE)).toBeCloseTo(MALE_BMR, PRECISION);
  });

  it('computes BMR for a woman', () => {
    expect(calculateBmr(FEMALE)).toBeCloseTo(FEMALE_BMR, PRECISION);
  });

  it('uses the 1984 constants, not the 1919 original', () => {
    const original1919 = 66.473 + 13.7516 * 80 + 5.0033 * 180 - 6.755 * 30;
    expect(calculateBmr(MALE)).not.toBeCloseTo(original1919, 1);
  });

  it('decreases with age and increases with weight and height', () => {
    expect(calculateBmr({ ...MALE, ageYears: 31 })).toBeLessThan(calculateBmr(MALE));
    expect(calculateBmr({ ...MALE, weightKg: 81 })).toBeGreaterThan(calculateBmr(MALE));
    expect(calculateBmr({ ...MALE, heightCm: 181 })).toBeGreaterThan(calculateBmr(MALE));
  });

  it('does not mutate its input', () => {
    const input = Object.freeze({ ...FEMALE });
    expect(() => calculateBmr(input)).not.toThrow();
    expect(input).toEqual(FEMALE);
  });
});

describe('calculateTdee', () => {
  const expectedMale: readonly [ActivityLevel, number, number][] = [
    ['sedentary', 1.2, 2224.3584],
    ['light', 1.375, 2548.744],
    ['moderate', 1.55, 2873.1296],
    ['veryActive', 1.725, 3197.5152],
    ['extraActive', 1.9, 3521.9008],
  ];
  const expectedFemale: readonly [ActivityLevel, number, number][] = [
    ['sedentary', 1.2, 1686.3996],
    ['light', 1.375, 1932.332875],
    ['moderate', 1.55, 2178.26615],
    ['veryActive', 1.725, 2424.199425],
    ['extraActive', 1.9, 2670.1327],
  ];

  it.each(expectedMale)('man, %s (×%d) → %d kcal', (activityLevel, multiplier, tdee) => {
    const result = calculateTdee({ ...MALE, activityLevel });
    expect(result.multiplier).toBe(multiplier);
    expect(result.bmr).toBeCloseTo(MALE_BMR, PRECISION);
    expect(result.tdee).toBeCloseTo(tdee, PRECISION);
  });

  it.each(expectedFemale)('woman, %s (×%d) → %d kcal', (activityLevel, multiplier, tdee) => {
    const result = calculateTdee({ ...FEMALE, activityLevel });
    expect(result.multiplier).toBe(multiplier);
    expect(result.bmr).toBeCloseTo(FEMALE_BMR, PRECISION);
    expect(result.tdee).toBeCloseTo(tdee, PRECISION);
  });

  it('exposes exactly the five official multipliers', () => {
    expect(ACTIVITY_LEVELS.map((level) => ACTIVITY_MULTIPLIERS[level])).toEqual([
      1.2, 1.375, 1.55, 1.725, 1.9,
    ]);
    expect(Object.isFrozen(ACTIVITY_MULTIPLIERS)).toBe(true);
  });

  it('returns an immutable result', () => {
    expect(Object.isFrozen(calculateTdee({ ...MALE, activityLevel: 'moderate' }))).toBe(true);
  });
});

describe('input validation', () => {
  const invalidBmrCases: readonly [string, Record<string, unknown>, string][] = [
    ['zero weight', { weightKg: 0 }, 'weightKg'],
    ['negative weight', { weightKg: -70 }, 'weightKg'],
    ['absurd weight', { weightKg: 501 }, 'weightKg'],
    ['NaN weight', { weightKg: Number.NaN }, 'weightKg'],
    ['string weight', { weightKg: '80' }, 'weightKg'],
    ['zero height', { heightCm: 0 }, 'heightCm'],
    ['infinite height', { heightCm: Number.POSITIVE_INFINITY }, 'heightCm'],
    ['negative age', { ageYears: -1 }, 'ageYears'],
    ['non-integer age', { ageYears: 30.5 }, 'ageYears'],
    ['unknown sex', { sex: 'other' }, 'sex'],
  ];

  it.each(invalidBmrCases)('rejects %s', (_label, override, field) => {
    const input = { ...MALE, ...override } as unknown as BmrInput;
    expect(() => calculateBmr(input)).toThrow(CalculationInputError);
    try {
      calculateBmr(input);
    } catch (error) {
      const issues = (error as CalculationInputError).issues;
      expect(issues.map((issue) => issue.field)).toContain(field);
    }
  });

  it('rejects an unknown activity level', () => {
    const input = { ...MALE, activityLevel: 'couch' } as unknown as TdeeInput;
    expect(() => calculateTdee(input)).toThrow(CalculationInputError);
  });

  it('rejects missing fields', () => {
    expect(() => calculateTdee({} as TdeeInput)).toThrow(CalculationInputError);
  });

  it('does not leak input values in the error message', () => {
    const secretWeight = -987654;
    try {
      calculateBmr({ ...MALE, weightKg: secretWeight });
      throw new Error('expected to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationInputError);
      expect((error as Error).message).not.toContain(String(secretWeight));
      expect(JSON.stringify((error as CalculationInputError).issues)).not.toContain(
        String(secretWeight),
      );
    }
  });
});

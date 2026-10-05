// Pure macro-distribution math — mirrors the style of
// src/features/energy/__tests__/energyCalculator.test.ts (hand-computed values,
// it.each tables, immutability checks, no leaking of raw input on error).
//
// Calorie target = maintenance TDEE (Module 1 has no goal adjustment).
// Default split: Protein 30% / Fat 25% / Carbs 45%. kcal/g: P 4, C 4, F 9.
//
// Reference BMR values (revised Harris-Benedict, 1984), from the energy suite:
// - Man   (80 kg, 180 cm, 30 y): BMR = 1853.632
// - Woman (60 kg, 165 cm, 25 y): BMR = 1405.333
// TDEE = BMR × activity multiplier; multipliers 1.2 / 1.375 / 1.55 / 1.725 / 1.9.

import {
  ACTIVITY_LEVELS,
  type ActivityLevel,
  calculateMacros,
  CalculationInputError,
  KCAL_PER_GRAM,
  type MacroResult,
  MACRO_SPLIT,
  type TdeeInput,
} from '../index';

const MALE: TdeeInput = {
  sex: 'male',
  weightKg: 80,
  heightCm: 180,
  ageYears: 30,
  activityLevel: 'moderate',
};
const FEMALE: TdeeInput = {
  sex: 'female',
  weightKg: 60,
  heightCm: 165,
  ageYears: 25,
  activityLevel: 'moderate',
};

// Reference BMR values (for documentation): MALE 1853.632, FEMALE 1405.333.
const PRECISION = 3;

// TDEE = BMR × multiplier for every activity level.
const MALE_TDEE: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 2224.3584,
  light: 2548.744,
  moderate: 2873.1296,
  veryActive: 3197.5152,
  extraActive: 3521.9008,
};
const FEMALE_TDEE: Readonly<Record<ActivityLevel, number>> = {
  sedentary: 1686.3996,
  light: 1932.332875,
  moderate: 2178.26615,
  veryActive: 2424.199425,
  extraActive: 2670.1327,
};

type Macro = 'protein' | 'fat' | 'carbs';
const MACROS: readonly Macro[] = ['protein', 'fat', 'carbs'];

function expectedGrams(calorieTarget: number, macro: Macro): number {
  return Math.round((calorieTarget * MACRO_SPLIT[macro]) / KCAL_PER_GRAM[macro]);
}

describe('MACRO_SPLIT and KCAL_PER_GRAM constants', () => {
  it('splits protein 30% / fat 25% / carbs 45%', () => {
    expect(MACRO_SPLIT).toEqual({ protein: 0.3, fat: 0.25, carbs: 0.45 });
  });

  it('sums to exactly 1.0', () => {
    const total = MACRO_SPLIT.protein + MACRO_SPLIT.fat + MACRO_SPLIT.carbs;
    expect(total).toBeCloseTo(1, 10);
  });

  it('uses 4 kcal/g for protein and carbs, 9 kcal/g for fat', () => {
    expect(KCAL_PER_GRAM).toEqual({ protein: 4, carbs: 4, fat: 9 });
  });

  it('exposes the constants as frozen objects', () => {
    expect(Object.isFrozen(MACRO_SPLIT)).toBe(true);
    expect(Object.isFrozen(KCAL_PER_GRAM)).toBe(true);
  });
});

describe('calculateMacros — calorie target equals maintenance TDEE', () => {
  const maleCases = ACTIVITY_LEVELS.map(
    (level) => [level, MALE_TDEE[level]] as const,
  );
  const femaleCases = ACTIVITY_LEVELS.map(
    (level) => [level, FEMALE_TDEE[level]] as const,
  );

  it.each(maleCases)('man, %s → calorieTarget = round(TDEE)', (activityLevel, tdee) => {
    const result = calculateMacros({ ...MALE, activityLevel });
    expect(result.tdee).toBeCloseTo(tdee, PRECISION);
    expect(result.calorieTarget).toBe(Math.round(tdee));
  });

  it.each(femaleCases)('woman, %s → calorieTarget = round(TDEE)', (activityLevel, tdee) => {
    const result = calculateMacros({ ...FEMALE, activityLevel });
    expect(result.tdee).toBeCloseTo(tdee, PRECISION);
    expect(result.calorieTarget).toBe(Math.round(tdee));
  });
});

describe('calculateMacros — grams per macro', () => {
  const subjects: readonly [string, TdeeInput][] = [
    ['man', MALE],
    ['woman', FEMALE],
  ];

  it.each(subjects)('%s: grams = round(calorieTarget * split / kcalPerGram)', (_label, input) => {
    const result = calculateMacros(input);
    for (const macro of MACROS) {
      expect(result[macro].grams).toBe(expectedGrams(result.calorieTarget, macro));
    }
  });

  it.each(subjects)('%s: kcal = grams * kcalPerGram and percent = split * 100', (_label, input) => {
    const result = calculateMacros(input);
    for (const macro of MACROS) {
      expect(result[macro].kcal).toBe(result[macro].grams * KCAL_PER_GRAM[macro]);
      expect(result[macro].percent).toBe(Math.round(MACRO_SPLIT[macro] * 100));
    }
  });

  it.each(subjects)('%s: macro kcal contributions reconstruct the target within rounding', (_label, input) => {
    const result = calculateMacros(input);
    const totalKcal = result.protein.kcal + result.fat.kcal + result.carbs.kcal;
    // Grams are rounded per macro, so allow a few kcal of rounding slack.
    expect(Math.abs(totalKcal - result.calorieTarget)).toBeLessThanOrEqual(9);
  });

  it('man (moderate): matches fully hand-computed grams', () => {
    // calorieTarget = round(2873.1296) = 2873
    // protein: round(2873 * 0.30 / 4) = round(215.475) = 215
    // fat:     round(2873 * 0.25 / 9) = round(79.8055…) = 80
    // carbs:   round(2873 * 0.45 / 4) = round(323.2125) = 323
    const result = calculateMacros(MALE);
    expect(result.calorieTarget).toBe(2873);
    expect(result.protein.grams).toBe(215);
    expect(result.fat.grams).toBe(80);
    expect(result.carbs.grams).toBe(323);
  });
});

describe('calculateMacros — immutability', () => {
  it('returns a deeply frozen result', () => {
    const result = calculateMacros(MALE);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.protein)).toBe(true);
    expect(Object.isFrozen(result.fat)).toBe(true);
    expect(Object.isFrozen(result.carbs)).toBe(true);
  });

  it('does not mutate its input', () => {
    const input = Object.freeze({ ...FEMALE });
    expect(() => calculateMacros(input)).not.toThrow();
    expect(input).toEqual(FEMALE);
  });
});

describe('calculateMacros — input validation', () => {
  const invalidCases: readonly [string, Record<string, unknown>, string][] = [
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
    ['unknown activity level', { activityLevel: 'couch' }, 'activityLevel'],
  ];

  it.each(invalidCases)('rejects %s with CalculationInputError', (_label, override, field) => {
    const input = { ...MALE, ...override } as unknown as TdeeInput;
    expect(() => calculateMacros(input)).toThrow(CalculationInputError);
    try {
      calculateMacros(input);
    } catch (error) {
      const issues = (error as CalculationInputError).issues;
      expect(issues.map((issue) => issue.field)).toContain(field);
    }
  });

  it('rejects missing fields', () => {
    expect(() => calculateMacros({} as TdeeInput)).toThrow(CalculationInputError);
  });

  it('does not leak raw input values in the error message or issues', () => {
    const secretWeight = -987654;
    try {
      calculateMacros({ ...MALE, weightKg: secretWeight });
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

describe('MacroResult type shape', () => {
  it('exposes calorieTarget, tdee, and the three macro breakdowns', () => {
    const result: MacroResult = calculateMacros(MALE);
    expect(result).toHaveProperty('calorieTarget');
    expect(result).toHaveProperty('tdee');
    for (const macro of MACROS) {
      expect(result[macro]).toMatchObject({
        grams: expect.any(Number),
        kcal: expect.any(Number),
        percent: expect.any(Number),
      });
    }
  });
});

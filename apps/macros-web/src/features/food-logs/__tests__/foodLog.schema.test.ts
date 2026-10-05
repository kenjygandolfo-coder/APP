import { describe, expect, it } from 'vitest';

import { COPY } from '../copy.es';
import { foodLogDefaults, foodLogSchema } from '../schemas/foodLog.schema';

const VALID_INPUT = {
  name: 'Pechuga de pollo',
  calories: '165',
  protein_g: '31',
  fat_g: '3.6',
  carbs_g: '0',
};

describe('foodLogSchema', () => {
  it('accepts a valid payload and coerces numeric strings', () => {
    const result = foodLogSchema.safeParse(VALID_INPUT);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: 'Pechuga de pollo',
        calories: 165,
        protein_g: 31,
        fat_g: 3.6,
        carbs_g: 0,
      });
    }
  });

  it('trims and rejects an empty name', () => {
    const result = foodLogSchema.safeParse({ ...VALID_INPUT, name: '   ' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('name'));
      expect(issue?.message).toBe(COPY.form.errors.required);
    }
  });

  it('rejects negative calories', () => {
    const result = foodLogSchema.safeParse({ ...VALID_INPUT, calories: '-5' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes('calories'),
      );
      expect(issue?.message).toBe(COPY.form.errors.nonNegative);
    }
  });

  it('rejects a negative macro value', () => {
    const result = foodLogSchema.safeParse({ ...VALID_INPUT, protein_g: '-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.path.includes('protein_g'),
      );
      expect(issue?.message).toBe(COPY.form.errors.nonNegative);
    }
  });

  it('rounds non-integer calories to satisfy the integer DB column', () => {
    const result = foodLogSchema.safeParse({ ...VALID_INPUT, calories: '120.6' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.calories).toBe(121);
      expect(Number.isInteger(result.data.calories)).toBe(true);
    }
  });

  it('keeps decimal precision for macro grams', () => {
    const result = foodLogSchema.safeParse({ ...VALID_INPUT, fat_g: '12.75' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fat_g).toBe(12.75);
    }
  });

  it('rejects non-numeric calories input', () => {
    const result = foodLogSchema.safeParse({ ...VALID_INPUT, calories: 'abc' });

    expect(result.success).toBe(false);
  });

  it('exposes empty-string defaults for controlled inputs', () => {
    expect(foodLogDefaults).toEqual({
      name: '',
      calories: '',
      protein_g: '',
      fat_g: '',
      carbs_g: '',
    });
  });
});

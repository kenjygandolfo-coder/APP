import type { z } from 'zod';

import { ACTIVITY_MULTIPLIERS } from './activityLevels';
import { CalculationInputError } from './CalculationInputError';
import {
  type BmrInput,
  bmrInputSchema,
  type TdeeInput,
  tdeeInputSchema,
} from './energy.schema';
import { HARRIS_BENEDICT_REVISED } from './harrisBenedict.constants';

export interface TdeeResult {
  readonly bmr: number;
  readonly multiplier: number;
  readonly tdee: number;
}

function parseOrThrow<S extends z.ZodTypeAny>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new CalculationInputError(
      result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }
  return result.data;
}

function computeBmr({ sex, weightKg, heightCm, ageYears }: BmrInput): number {
  const c = HARRIS_BENEDICT_REVISED[sex];
  return c.base + c.weight * weightKg + c.height * heightCm - c.age * ageYears;
}

/** Basal Metabolic Rate (kcal/day) — revised Harris-Benedict (1984). */
export function calculateBmr(input: BmrInput): number {
  return computeBmr(parseOrThrow(bmrInputSchema, input));
}

/** Total Daily Energy Expenditure (kcal/day) = BMR × activity multiplier. */
export function calculateTdee(input: TdeeInput): TdeeResult {
  const parsed = parseOrThrow(tdeeInputSchema, input);
  const bmr = computeBmr(parsed);
  const multiplier = ACTIVITY_MULTIPLIERS[parsed.activityLevel];
  return Object.freeze({ bmr, multiplier, tdee: bmr * multiplier });
}

import {
  CalculationInputError,
  calculateTdee,
  type TdeeInput,
  tdeeInputSchema,
} from '@energy';

import { KCAL_PER_GRAM, type MacroName, MACRO_SPLIT } from './macros.constants';

/** Grams / kcal / percent breakdown for a single macronutrient. */
export interface MacroBreakdown {
  readonly grams: number;
  readonly kcal: number;
  readonly percent: number;
}

/** Full macro-distribution result for a maintenance calorie target. */
export interface MacroResult {
  readonly calorieTarget: number;
  readonly tdee: number;
  readonly protein: MacroBreakdown;
  readonly fat: MacroBreakdown;
  readonly carbs: MacroBreakdown;
}

/**
 * Derive the gram / kcal / percent breakdown for one macro from a calorie
 * target. Grams are rounded to the nearest integer; kcal is recomputed from
 * the rounded grams so the two numbers stay internally consistent.
 */
function computeMacro(macro: MacroName, calorieTarget: number): MacroBreakdown {
  const split = MACRO_SPLIT[macro];
  const kcalPerGram = KCAL_PER_GRAM[macro];
  const grams = Math.round((calorieTarget * split) / kcalPerGram);
  return Object.freeze({
    grams,
    kcal: grams * kcalPerGram,
    percent: Math.round(split * 100),
  });
}

/**
 * Compute the maintenance macro distribution for the given input.
 *
 * The calorie target equals the maintenance TDEE (Module 1 applies no goal
 * adjustment), rounded to the nearest whole kcal. Input is validated with the
 * reused energy schema; invalid input throws {@link CalculationInputError}
 * without echoing the raw values.
 */
export function calculateMacros(input: TdeeInput): MacroResult {
  const parsed = tdeeInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new CalculationInputError(
      parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }

  const { tdee } = calculateTdee(parsed.data);
  const calorieTarget = Math.round(tdee);

  return Object.freeze({
    calorieTarget,
    tdee,
    protein: computeMacro('protein', calorieTarget),
    fat: computeMacro('fat', calorieTarget),
    carbs: computeMacro('carbs', calorieTarget),
  });
}

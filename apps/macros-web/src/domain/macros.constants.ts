/**
 * Macro-distribution constants for the maintenance macro calculator.
 *
 * Chosen default split (balanced, moderate-protein maintenance profile):
 *   - Protein 30%
 *   - Fat     25%
 *   - Carbs   45%
 * The three fractions MUST sum to 1.0. To change the distribution, edit the
 * values below (and keep the sum at 1.0); no other code needs to change.
 *
 * Energy density per gram (Atwater general factors):
 *   - Protein 4 kcal/g
 *   - Carbs   4 kcal/g
 *   - Fat     9 kcal/g
 */

export type MacroName = 'protein' | 'fat' | 'carbs';

/** Fraction of the calorie target assigned to each macro. Sums to 1.0. */
export const MACRO_SPLIT: Readonly<Record<MacroName, number>> = Object.freeze({
  protein: 0.3,
  fat: 0.25,
  carbs: 0.45,
});

/** Energy density (kcal per gram) for each macro. */
export const KCAL_PER_GRAM: Readonly<Record<MacroName, number>> = Object.freeze({
  protein: 4,
  carbs: 4,
  fat: 9,
});

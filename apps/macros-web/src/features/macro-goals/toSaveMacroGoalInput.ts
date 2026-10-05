import type { MacroResult } from '../../domain';
import type { SaveMacroGoalInput } from './types';

/**
 * Map a computed {@link MacroResult} (Module-2 domain shape) plus the
 * authenticated `userId` into the {@link SaveMacroGoalInput} the data layer
 * persists. The Module-2 wizard computes a maintenance distribution, so
 * `goal_type` is `'mantenimiento'`; `is_active` is left to the save strategy.
 *
 * Returns a fresh object (never mutates `result`). `tdee` and `calorie_target`
 * are rounded to whole numbers to match the integer DB columns.
 */
export function toSaveMacroGoalInput(
  userId: string,
  result: MacroResult,
): SaveMacroGoalInput {
  return {
    user_id: userId,
    goal_type: 'mantenimiento',
    tdee: Math.round(result.tdee),
    calorie_target: result.calorieTarget,
    protein_g: result.protein.grams,
    fat_g: result.fat.grams,
    carbs_g: result.carbs.grams,
  };
}

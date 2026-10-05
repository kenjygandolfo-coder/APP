import type { Database, GoalType } from '../../data/database.types';

/**
 * The ordered, frozen set of macro-goal types. ASCII values match the DB
 * `goal_type` enum (the UI supplies accented labels). Exported as a tuple so a
 * future zod schema can build `z.enum(GOAL_TYPES)` without duplicating the
 * literals.
 */
export const GOAL_TYPES = Object.freeze([
  'deficit',
  'mantenimiento',
  'volumen',
] as const satisfies readonly GoalType[]);

/**
 * Domain-facing representation of a persisted macro goal. This is the exact DB
 * row shape (`macro_goals.Row`), re-exported from the feature so callers depend
 * on the feature boundary rather than reaching into `data/database.types`.
 *
 * Fields align with the Module-2 `MacroResult` domain shape: `tdee` +
 * `calorie_target` plus the `protein_g` / `fat_g` / `carbs_g` gram breakdown.
 */
export type MacroGoal = Database['public']['Tables']['macro_goals']['Row'];

type MacroGoalInsert = Database['public']['Tables']['macro_goals']['Insert'];

/**
 * Input accepted by {@link saveMacroGoal}. Derived from the DB `Insert` type
 * with the server-managed columns (`id`, `created_at`, `updated_at`) omitted;
 * `is_active` stays optional because the save strategy sets it. `user_id`,
 * `goal_type`, `tdee`, `calorie_target`, and the gram breakdown are required.
 */
export type SaveMacroGoalInput = Omit<
  MacroGoalInsert,
  'id' | 'created_at' | 'updated_at'
>;

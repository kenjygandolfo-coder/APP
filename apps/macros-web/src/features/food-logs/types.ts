import type { Database } from '../../data/database.types';

/**
 * Domain-facing representation of a persisted food log. This is the exact DB
 * row shape (`food_logs.Row`), re-exported from the feature so callers depend
 * on the feature boundary rather than reaching into `data/database.types`.
 *
 * Fields mirror the Module-2 macro breakdown (`calories`, `protein_g`,
 * `fat_g`, `carbs_g`) so a day's logs can be summed against a `MacroGoal`.
 */
export type FoodLog = Database['public']['Tables']['food_logs']['Row'];

type FoodLogInsert = Database['public']['Tables']['food_logs']['Insert'];

/**
 * Input accepted by `addFoodLog`. Derived from the DB `Insert` type with the
 * server-managed columns (`id`, `created_at`, `updated_at`) omitted. `user_id`,
 * `name`, and `calories` stay required; `quantity` is relaxed to optional
 * (alongside the already-optional `unit`, `logged_on`, `protein_g`, `fat_g`,
 * `carbs_g`) because the data layer applies documented defaults for the columns
 * the manual form omits.
 */
export type AddFoodLogInput = Omit<
  FoodLogInsert,
  'id' | 'created_at' | 'updated_at' | 'quantity'
> & { quantity?: number };

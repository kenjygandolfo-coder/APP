import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../data/database.types';
import type { MacroGoal, SaveMacroGoalInput } from './types';

/** The typed Supabase client this data layer operates on. */
type Client = SupabaseClient<Database>;

/**
 * Wrap a Supabase/Postgrest failure in a clear, non-leaky Error.
 *
 * Only a stable `context` string is surfaced to the caller; the raw Postgrest
 * `message` / `details` / `hint` are intentionally NOT included so internal
 * schema or policy details never leak to the UI or logs.
 */
function toClearError(context: string, error: unknown): Error {
  // The raw Postgrest error is attached as `cause` for low-level debugging
  // only; it is NEVER interpolated into `message`, so the surfaced string
  // leaks no schema, policy, or hint internals.
  return new Error(`macro-goals: ${context}`, { cause: error });
}

/**
 * Read the single active macro goal for a user.
 *
 * Pure async wrapper over the injected client (the client is a parameter so
 * tests inject a mock and no module-level singleton is needed). Returns the
 * mapped {@link MacroGoal} or `null` when the user has no active goal.
 */
export async function getActiveMacroGoal(
  client: Client,
  userId: string,
): Promise<MacroGoal | null> {
  const { data, error } = await client
    .from('macro_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw toClearError('failed to load the active macro goal', error);
  }

  return data ?? null;
}

/**
 * Persist a macro goal as the user's single active goal, atomically.
 *
 * Delegates the whole deactivate-then-insert switch to the Postgres RPC
 * `save_active_macro_goal` (see migration 0002). Running both steps inside one
 * transaction server-side closes the non-atomic gap of the old two-round-trip
 * approach: if the insert failed after the deactivate, the user could be left
 * with no active goal. Ownership is derived server-side from `auth.uid()`, so
 * this layer passes ONLY the goal fields — never `user_id` or `is_active`; the
 * client is not trusted to assert ownership. A fresh args object is built from
 * `input`, so the caller's object is never mutated.
 */
export async function saveMacroGoal(
  client: Client,
  input: SaveMacroGoalInput,
): Promise<MacroGoal> {
  const { data, error } = await client.rpc('save_active_macro_goal', {
    p_goal_type: input.goal_type,
    p_tdee: input.tdee,
    p_calorie_target: input.calorie_target,
    p_protein_g: input.protein_g,
    p_fat_g: input.fat_g,
    p_carbs_g: input.carbs_g,
  });

  if (error) {
    throw toClearError('failed to save the macro goal', error);
  }

  // The RPC always returns the inserted row or raises (surfaced above as
  // `error`), so a success with no row is not expected. Guard it anyway so the
  // `Promise<MacroGoal>` signature matches the runtime value and the UI never
  // receives a silent `null`.
  if (!data) {
    throw toClearError('failed to save the macro goal', null);
  }

  return data;
}

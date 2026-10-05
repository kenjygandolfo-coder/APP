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
 * Persist a macro goal as the user's single active goal.
 *
 * Strategy (single-active invariant): first deactivate every currently active
 * goal for the user (`is_active = false`), then insert the new row with
 * `is_active = true`. This keeps exactly one active goal per user and plays
 * nicely with the partial unique index in the migration. The input is never
 * mutated; `is_active` is forced on a fresh object.
 */
export async function saveMacroGoal(
  client: Client,
  input: SaveMacroGoalInput,
): Promise<MacroGoal> {
  const { error: deactivateError } = await client
    .from('macro_goals')
    .update({ is_active: false })
    .eq('user_id', input.user_id)
    .eq('is_active', true);

  if (deactivateError) {
    throw toClearError('failed to deactivate previous macro goals', deactivateError);
  }

  const { data, error } = await client
    .from('macro_goals')
    .insert({ ...input, is_active: true })
    .select()
    .single();

  if (error) {
    throw toClearError('failed to save the macro goal', error);
  }

  return data;
}

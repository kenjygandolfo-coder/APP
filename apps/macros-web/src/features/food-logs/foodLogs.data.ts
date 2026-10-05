import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../data/database.types';
import type { AddFoodLogInput, FoodLog } from './types';

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
  return new Error(`food-logs: ${context}`, { cause: error });
}

/**
 * Read every food log a user recorded on a given calendar date, oldest first.
 *
 * Pure async wrapper over the injected client (the client is a parameter so
 * tests inject a mock and no module-level singleton is needed). Always resolves
 * to an array — `[]` when the user logged nothing that day, never `null`.
 */
export async function getDailyFoodLogs(
  client: Client,
  userId: string,
  date: string,
): Promise<FoodLog[]> {
  const { data, error } = await client
    .from('food_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('logged_on', date)
    .order('created_at', { ascending: true });

  if (error) {
    throw toClearError('failed to load the daily food logs', error);
  }

  return data ?? [];
}

/**
 * Insert a single food log and return the persisted row.
 *
 * The input is never mutated; a fresh insert object is built that applies
 * documented defaults for required columns the manual form omits:
 *   - `quantity` defaults to 1 and `unit` defaults to 'serving'. The manual
 *     form captures per-serving macro totals, so quantity=1 serving keeps the
 *     DB `CHECK (quantity > 0)` satisfied without asking the user for a value.
 * Any value the caller does provide takes precedence over these defaults.
 */
export async function addFoodLog(
  client: Client,
  input: AddFoodLogInput,
): Promise<FoodLog> {
  const insertRow = {
    ...input,
    quantity: input.quantity ?? 1,
    unit: input.unit ?? 'serving',
  };

  const { data, error } = await client
    .from('food_logs')
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    throw toClearError('failed to add the food log', error);
  }

  return data;
}

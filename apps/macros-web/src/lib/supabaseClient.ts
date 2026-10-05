import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../data/database.types';
import { readSupabaseEnv } from './env';

/**
 * Supabase client singleton for the web app.
 *
 * Auth seam: the client reads the current session/user via
 * `supabase.auth.getUser()` (and `supabase.auth.getSession()`). The auth submit
 * flow (`src/features/auth/useAuthActions.ts`) calls
 * `supabase.auth.signInWithPassword` / `signUp` on this client, and supabase-js
 * owns session persistence (localStorage on web). Row Level Security on the
 * data tables uses `auth.uid()` from the session established here.
 *
 * The client is parameterized with {@link Database} (the strict hand-written
 * schema in `src/data/database.types.ts`) so every query is fully typed with
 * no `any`.
 */
let client: SupabaseClient<Database> | null = null;

/**
 * Lazily creates and memoizes the Supabase client.
 *
 * The client is built on first use so that a missing-env error only surfaces
 * when the app actually needs Supabase. Tests can bypass this entirely by
 * injecting a mock client into the data-access layer, keeping them free of any
 * real env requirement.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (client === null) {
    const { url, anonKey } = readSupabaseEnv();
    client = createClient<Database>(url, anonKey);
  }
  return client;
}

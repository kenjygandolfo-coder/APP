import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { readSupabaseEnv } from './env';

/**
 * Supabase client singleton for the web app.
 *
 * Auth seam: the client reads the current session/user via
 * `supabase.auth.getUser()` (and `supabase.auth.getSession()`). Today the auth
 * submit flow in `src/features/auth/useAuthSubmit.ts` is still a stub that
 * persists a dev placeholder token; that stub is the exact seam where the real
 * Supabase sign-in (e.g. `supabase.auth.signInWithPassword`) will later be
 * wired in to populate this session. Once that happens, Row Level Security on
 * the data tables uses `auth.uid()` from the session established here.
 *
 * TODO(FEAT-002): parameterize the client as `SupabaseClient<Database>` once
 * `src/data/database.types.ts` exists. Until then it is left ungeneric so the
 * schema is not invented here (that is FEAT-002's job) and the module compiles
 * with no `any`.
 */
let client: SupabaseClient | null = null;

/**
 * Lazily creates and memoizes the Supabase client.
 *
 * The client is built on first use so that a missing-env error only surfaces
 * when the app actually needs Supabase. Tests can bypass this entirely by
 * injecting a mock client into the data-access layer, keeping them free of any
 * real env requirement.
 */
export function getSupabaseClient(): SupabaseClient {
  if (client === null) {
    const { url, anonKey } = readSupabaseEnv();
    client = createClient(url, anonKey);
  }
  return client;
}

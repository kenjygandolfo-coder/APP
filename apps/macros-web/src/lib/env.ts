/**
 * Secret-safe reader for the Supabase environment variables.
 *
 * The anon key is public by design (it ships to the browser and is gated by
 * Row Level Security), so it is safe to read from `import.meta.env`. A
 * service_role key must NEVER be exposed here or committed to the repo.
 */

/** Immutable, validated Supabase configuration. */
export interface SupabaseEnv {
  readonly url: string;
  readonly anonKey: string;
}

/**
 * Reads and validates the Supabase env vars.
 *
 * Pure helper: given the same `import.meta.env` it always returns the same
 * frozen object (or throws). Throws a clear Error naming every missing/empty
 * variable WITHOUT leaking the values that were present.
 */
export function readSupabaseEnv(): SupabaseEnv {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

  const missing: string[] = [];
  if (url === '') {
    missing.push('VITE_SUPABASE_URL');
  }
  if (anonKey === '') {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variable(s): ${missing.join(', ')}. ` +
        'Copy apps/macros-web/.env.example to .env and fill them in.',
    );
  }

  return Object.freeze({ url, anonKey });
}

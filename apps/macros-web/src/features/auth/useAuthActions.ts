import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../../data/database.types';
import { signInWithPassword, signUpWithPassword } from './auth.data';
import type { LoginValues, RegisterValues } from './schemas/auth.schema';
import { getSupabaseClient } from '../../lib/supabaseClient';
import type { AuthSubmitHandler } from './types';

type Client = SupabaseClient<Database>;

/**
 * Resolve the Supabase client, defaulting to the lazy singleton. The parameter
 * stays injectable so unit tests can pass a mock client and never touch real
 * env variables.
 */
function resolveClient(client?: Client): Client {
  return client ?? getSupabaseClient();
}

/**
 * Build the real Login submit handler. It forwards the validated email +
 * password to {@link signInWithPassword}; the resolved session is discarded
 * here because `SessionProvider`'s `onAuthStateChange` subscription is the
 * single source of truth for session state.
 */
export function makeLoginSubmit(client?: Client): AuthSubmitHandler<LoginValues> {
  return async (values: LoginValues): Promise<void> => {
    await signInWithPassword(resolveClient(client), {
      email: values.email,
      password: values.password,
    });
  };
}

/**
 * Build the real Registro submit handler. Maps {@link RegisterValues} to the
 * `{ email, password }` the provider expects, intentionally DROPPING
 * `confirmPassword` so it never reaches Supabase.
 */
export function makeRegisterSubmit(
  client?: Client,
): AuthSubmitHandler<RegisterValues> {
  return async (values: RegisterValues): Promise<void> => {
    await signUpWithPassword(resolveClient(client), {
      email: values.email,
      password: values.password,
    });
  };
}

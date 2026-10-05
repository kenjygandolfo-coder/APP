import type {
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import type { Database } from '../../data/database.types';

/** The typed Supabase client this auth data layer operates on. */
type Client = SupabaseClient<Database>;

/** Email + password credentials consumed by the sign-in / sign-up calls. */
export interface AuthCredentials {
  readonly email: string;
  readonly password: string;
}

/**
 * Wrap a Supabase {@link AuthError} in a clear, non-leaky Error.
 *
 * Only a stable `context` string is surfaced to the caller; the raw provider
 * `message` / `status` / `name` are intentionally NOT interpolated into the
 * surfaced `message`, so no internal auth details leak to the UI or logs. The
 * raw error is attached as `cause` for low-level debugging only.
 */
function toClearError(context: string, error: unknown): Error {
  return new Error(`auth: ${context}`, { cause: error });
}

/**
 * Sign a user in with email + password.
 *
 * Pure async wrapper over the injected client (the client is a parameter so
 * tests inject a mock and no module-level singleton is needed). Returns the
 * SDK {@link Session} on success.
 */
export async function signInWithPassword(
  client: Client,
  credentials: AuthCredentials,
): Promise<Session> {
  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw toClearError('invalid email or password', error);
  }

  return data.session;
}

/**
 * Register a new account with email + password.
 *
 * Only `email` and `password` are forwarded; the form's `confirmPassword` is
 * validated in zod and must never reach the provider. The returned
 * {@link Session} may be `null` when email confirmation is required before the
 * account becomes active.
 */
export async function signUpWithPassword(
  client: Client,
  credentials: AuthCredentials,
): Promise<Session | null> {
  const { data, error } = await client.auth.signUp({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw toClearError('could not register this account', error);
  }

  return data.session;
}

/** Sign the current user out, clearing the local session. */
export async function signOut(client: Client): Promise<void> {
  const { error } = await client.auth.signOut();

  if (error) {
    throw toClearError('could not sign out', error);
  }
}

/** Read the current session, or `null` when no user is signed in. */
export async function getCurrentSession(
  client: Client,
): Promise<Session | null> {
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw toClearError('could not read the current session', error);
  }

  return data.session;
}

/** Read the current user, or `null` when no user is signed in. */
export async function getCurrentUser(client: Client): Promise<User | null> {
  const { data, error } = await client.auth.getUser();

  if (error) {
    throw toClearError('could not read the current user', error);
  }

  return data.user;
}

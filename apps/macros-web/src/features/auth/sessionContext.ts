import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Lifecycle of the auth session as seen by the UI.
 *
 * - `loading`: the initial `getSession()` bootstrap has not resolved yet.
 * - `authenticated`: a session with a user is present.
 * - `anonymous`: no session (signed out or never signed in).
 */
export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

/**
 * Read-only snapshot of the current authentication state exposed through the
 * session context. `userId` is derived from `session?.user?.id` so data hooks
 * (e.g. useMacroGoal) can consume a plain `string | null`.
 */
export interface SessionState {
  readonly session: Session | null;
  readonly user: User | null;
  readonly userId: string | null;
  readonly status: SessionStatus;
}

/** The state used before the first `getSession()` bootstrap resolves. */
export const initialSessionState: SessionState = {
  session: null,
  user: null,
  userId: null,
  status: 'loading',
};

/**
 * Derive the full {@link SessionState} from a raw SDK session. Keeps `userId`
 * and `status` consistent with the session in a single place.
 */
export function toSessionState(session: Session | null): SessionState {
  const user = session?.user ?? null;
  return {
    session,
    user,
    userId: user?.id ?? null,
    status: session ? 'authenticated' : 'anonymous',
  };
}

/**
 * Context carrying the current {@link SessionState}. The default is `null` so
 * {@link useSession} can detect usage outside of a provider and throw a clear
 * error instead of silently returning a stale default.
 */
export const SessionContext = createContext<SessionState | null>(null);

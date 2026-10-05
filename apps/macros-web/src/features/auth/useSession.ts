import { useContext } from 'react';

import { SessionContext, type SessionState } from './sessionContext';

/**
 * Read the current {@link SessionState} from the nearest `SessionProvider`.
 *
 * Throws a clear error when used outside of a provider so misuse is caught
 * immediately in development rather than surfacing as a confusing default.
 */
export function useSession(): SessionState {
  const state = useContext(SessionContext);

  if (state === null) {
    throw new Error('useSession must be used within a <SessionProvider>');
  }

  return state;
}

/**
 * Convenience selector for the authenticated user's id, or `null` when signed
 * out. Mirrors the shape data hooks (useMacroGoal / useSaveMacroGoal) expect.
 */
export function useCurrentUserId(): string | null {
  return useSession().userId;
}

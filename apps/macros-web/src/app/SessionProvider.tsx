import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';

import type { Database } from '../data/database.types';
import { getCurrentSession } from '../features/auth/auth.data';
import {
  SessionContext,
  initialSessionState,
  toSessionState,
  type SessionState,
} from '../features/auth/sessionContext';
import { getSupabaseClient } from '../lib/supabaseClient';

type Client = SupabaseClient<Database>;

interface SessionProviderProps {
  readonly children: ReactNode;
  /**
   * Injectable client (defaults to the lazy singleton) so tests can pass a
   * mock without requiring Supabase env variables.
   */
  readonly client?: Client;
}

/**
 * Seeds the auth session once on mount via `getCurrentSession()` (session
 * bootstrap, not data fetching) and keeps it in sync through an
 * `onAuthStateChange` subscription. The subscription is torn down on unmount.
 *
 * BOOTSTRAP ORDERING: the async seed and the subscription both write state, so
 * the seed is applied ONLY while `status === 'loading'` (functional update).
 * This guards against a slow-resolving seed clobbering a newer `onAuthStateChange`
 * event (e.g. INITIAL_SESSION / SIGNED_IN) that already landed first. The
 * subscription remains the source of truth once the first real event arrives.
 */
export function SessionProvider({
  children,
  client,
}: SessionProviderProps): JSX.Element {
  const [state, setState] = useState<SessionState>(initialSessionState);

  useEffect(() => {
    const activeClient = client ?? getSupabaseClient();
    let active = true;

    // The seed only wins while still loading; a real auth event that already
    // moved status off 'loading' is never overwritten by a late seed.
    const applySeed = (session: Session | null): void => {
      if (!active) {
        return;
      }
      setState((prev) =>
        prev.status === 'loading' ? toSessionState(session) : prev,
      );
    };

    getCurrentSession(activeClient)
      .then(applySeed)
      .catch(() => applySeed(null));

    const { data } = activeClient.auth.onAuthStateChange((_event, session) => {
      // Auth events are authoritative and always applied.
      setState(toSessionState(session));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}

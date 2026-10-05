import type { SupabaseClient } from '@supabase/supabase-js';
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
 */
export function SessionProvider({
  children,
  client,
}: SessionProviderProps): JSX.Element {
  const [state, setState] = useState<SessionState>(initialSessionState);

  useEffect(() => {
    const activeClient = client ?? getSupabaseClient();
    let active = true;

    getCurrentSession(activeClient)
      .then((session) => {
        if (active) {
          setState(toSessionState(session));
        }
      })
      .catch(() => {
        if (active) {
          setState(toSessionState(null));
        }
      });

    const { data } = activeClient.auth.onAuthStateChange((_event, session) => {
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

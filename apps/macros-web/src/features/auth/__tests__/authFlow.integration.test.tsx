import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Database } from '../../../data/database.types';
import { SessionProvider } from '../../../app/SessionProvider';
import { LoginForm } from '../LoginForm';
import { useSession } from '../useSession';
import { useMacroGoal } from '../../macro-goals/useMacroGoal';

type Client = SupabaseClient<Database>;

// Keep the macro-goals data layer out of the picture: the query must be ENABLED
// once a userId exists, which is the invariant under test. A never-resolving
// fetch keeps it in 'fetching' without needing a live Supabase project.
vi.mock('../../macro-goals/macroGoals.data', () => ({
  getActiveMacroGoal: () => new Promise(() => undefined),
}));

// useMacroGoal evaluates getSupabaseClient() to build its queryFn; stub it so
// the enabled query runs without requiring Supabase env.
vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth: {} }),
}));

const USER_ID = '11111111-1111-1111-1111-111111111111';

const SESSION = {
  access_token: 'token',
  token_type: 'bearer',
  expires_in: 3600,
  refresh_token: 'refresh',
  user: { id: USER_ID },
} as unknown as Session;

/**
 * Mock Supabase client whose auth surface starts anonymous, then emits the
 * signed-in session through `onAuthStateChange` when `emit()` is invoked.
 */
function makeMockClient(): {
  readonly client: Client;
  readonly emit: () => void;
} {
  let handler: ((event: string, session: Session | null) => void) | null = null;
  const client = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: (
        cb: (event: string, session: Session | null) => void,
      ) => {
        handler = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  } as unknown as Client;

  return {
    client,
    emit: () => handler?.('SIGNED_IN', SESSION),
  };
}

/** Probe that reads the live session and feeds its userId into useMacroGoal. */
function MacroGoalProbe(): JSX.Element {
  const { userId } = useSession();
  const macroGoal = useMacroGoal(userId);
  return (
    <div>
      <span data-testid="user-id">{userId ?? 'none'}</span>
      <span data-testid="fetch-status">{macroGoal.fetchStatus}</span>
    </div>
  );
}

describe('auth flow integration', () => {
  it('a successful login exposes a userId that enables useMacroGoal', async () => {
    const user = userEvent.setup();
    const { client, emit } = makeMockClient();

    const signIn = vi.fn(() => Promise.resolve(SESSION));
    const onSubmit = async (): Promise<void> => {
      await signIn();
      // Simulate supabase-js broadcasting the new session to subscribers.
      emit();
    };

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const Wrapper = ({ children }: { readonly children: ReactNode }): JSX.Element => (
      <SessionProvider client={client}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    );

    render(
      <Wrapper>
        <LoginForm onSubmit={onSubmit} />
        <MacroGoalProbe />
      </Wrapper>,
    );

    // Before login: anonymous, so the macro-goal query stays idle.
    await waitFor(() =>
      expect(screen.getByTestId('user-id')).toHaveTextContent('none'),
    );
    expect(screen.getByTestId('fetch-status')).toHaveTextContent('idle');

    await user.type(
      screen.getByLabelText(/correo/i),
      'ana@ejemplo.com',
    );
    await user.type(screen.getByLabelText(/contraseña/i), 'superSecreta1');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // After login: the session carries a real userId, which enables the query.
    await waitFor(() =>
      expect(screen.getByTestId('user-id')).toHaveTextContent(USER_ID),
    );
    await waitFor(
      () =>
        expect(screen.getByTestId('fetch-status')).toHaveTextContent(
          'fetching',
        ),
      { timeout: 3000 },
    );
    expect(signIn).toHaveBeenCalledTimes(1);
  });
});

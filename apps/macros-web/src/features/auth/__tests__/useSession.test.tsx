import type {
  AuthChangeEvent,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Database } from '../../../data/database.types';
import { SessionProvider } from '../../../app/SessionProvider';
import { useSession } from '../useSession';

type Client = SupabaseClient<Database>;
type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;

const sampleUser: User = {
  id: 'user-1',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
  email: 'cozy@example.com',
} as unknown as User;

const sampleSession: Session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: sampleUser,
} as unknown as Session;

interface MockClient {
  readonly client: Client;
  readonly unsubscribe: ReturnType<typeof vi.fn>;
  fireAuthChange(session: Session | null): void;
}

/**
 * Build a mock client whose `getSession` resolves `initialSession` and whose
 * `onAuthStateChange` captures the callback so the test can drive auth events.
 */
function createMockClient(initialSession: Session | null): MockClient {
  const unsubscribe = vi.fn();
  let captured: AuthCallback | null = null;

  const client = {
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: initialSession }, error: null }),
      onAuthStateChange: vi.fn((callback: AuthCallback) => {
        captured = callback;
        return { data: { subscription: { unsubscribe } } };
      }),
    },
  } as unknown as Client;

  return {
    client,
    unsubscribe,
    fireAuthChange(session: Session | null): void {
      if (captured === null) {
        throw new Error('onAuthStateChange callback was not registered');
      }
      act(() => {
        captured?.('SIGNED_OUT', session);
      });
    },
  };
}

function createWrapper(client: Client) {
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <SessionProvider client={client}>{children}</SessionProvider>;
  };
}

describe('useSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seeds authenticated status and userId from getSession', async () => {
    const mock = createMockClient(sampleSession);

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(mock.client),
    });

    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.userId).toBe('user-1');
    expect(result.current.user).toEqual(sampleUser);
    expect(result.current.session).toEqual(sampleSession);
  });

  it('flips to anonymous with null userId when auth change fires null', async () => {
    const mock = createMockClient(sampleSession);

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(mock.client),
    });

    await waitFor(() => expect(result.current.status).toBe('authenticated'));

    mock.fireAuthChange(null);

    expect(result.current.status).toBe('anonymous');
    expect(result.current.userId).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('unsubscribes exactly once on unmount', async () => {
    const mock = createMockClient(null);

    const { result, unmount } = renderHook(() => useSession(), {
      wrapper: createWrapper(mock.client),
    });

    await waitFor(() => expect(result.current.status).toBe('anonymous'));

    unmount();

    expect(mock.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error when used outside the provider', () => {
    expect(() => renderHook(() => useSession())).toThrow(
      /within a <SessionProvider>/,
    );
  });

  it('does not let a late seed clobber a newer auth event (bootstrap race)', async () => {
    // getSession resolves LATE (deferred), so an auth event can land first.
    let resolveSeed: (value: {
      data: { session: Session | null };
      error: null;
    }) => void = () => undefined;
    let captured: AuthCallback | null = null;
    const unsubscribe = vi.fn();

    const client = {
      auth: {
        getSession: vi.fn(
          () =>
            new Promise((resolve) => {
              resolveSeed = resolve;
            }),
        ),
        onAuthStateChange: vi.fn((callback: AuthCallback) => {
          captured = callback;
          return { data: { subscription: { unsubscribe } } };
        }),
      },
    } as unknown as Client;

    const { result } = renderHook(() => useSession(), {
      wrapper: createWrapper(client),
    });

    // A fresh auth event arrives BEFORE the seed resolves.
    act(() => {
      captured?.('SIGNED_IN', sampleSession);
    });
    expect(result.current.status).toBe('authenticated');
    expect(result.current.userId).toBe('user-1');

    // The late seed (null session) must NOT overwrite the newer authenticated
    // state, because the seed only applies while status === 'loading'.
    await act(async () => {
      resolveSeed({ data: { session: null }, error: null });
      await Promise.resolve();
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.userId).toBe('user-1');
  });
});

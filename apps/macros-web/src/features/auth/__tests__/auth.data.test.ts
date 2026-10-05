import type {
  AuthError,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { Database } from '../../../data/database.types';
import {
  getCurrentSession,
  getCurrentUser,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from '../auth.data';

type Client = SupabaseClient<Database>;

/**
 * An AuthError-shaped failure whose internals must never leak to the caller.
 * The RAW_LEAK marker is asserted to be absent from any surfaced message.
 */
const RAW_LEAK = 'User already registered super-secret-detail';
const authError = {
  message: RAW_LEAK,
  status: 400,
  name: 'AuthApiError',
} as unknown as AuthError;

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

interface AuthMocks {
  readonly signInWithPassword: ReturnType<typeof vi.fn>;
  readonly signUp: ReturnType<typeof vi.fn>;
  readonly signOut: ReturnType<typeof vi.fn>;
  readonly getSession: ReturnType<typeof vi.fn>;
  readonly getUser: ReturnType<typeof vi.fn>;
}

/** Build a client whose `auth` methods are individually controllable mocks. */
function mockAuthClient(overrides: Partial<AuthMocks> = {}): {
  client: Client;
  auth: AuthMocks;
} {
  const auth: AuthMocks = {
    signInWithPassword: overrides.signInWithPassword ?? vi.fn(),
    signUp: overrides.signUp ?? vi.fn(),
    signOut: overrides.signOut ?? vi.fn(),
    getSession: overrides.getSession ?? vi.fn(),
    getUser: overrides.getUser ?? vi.fn(),
  };
  const client = { auth } as unknown as Client;
  return { client, auth };
}

const credentials = { email: 'cozy@example.com', password: 'enchanted-pass' };

describe('signInWithPassword', () => {
  it('returns the mapped session on success', async () => {
    const { client, auth } = mockAuthClient({
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { session: sampleSession }, error: null }),
    });

    await expect(signInWithPassword(client, credentials)).resolves.toEqual(
      sampleSession,
    );
    expect(auth.signInWithPassword).toHaveBeenCalledWith(credentials);
  });

  it('throws a clear error that does not leak provider internals', async () => {
    const { client } = mockAuthClient({
      signInWithPassword: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: authError }),
    });

    const error = await signInWithPassword(client, credentials).catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('invalid email or password');
    expect((error as Error).message).not.toContain(RAW_LEAK);
    expect((error as Error).cause).toBe(authError);
  });
});

describe('signUpWithPassword', () => {
  it('forwards only email and password and returns the session', async () => {
    const signUp = vi
      .fn()
      .mockResolvedValue({ data: { session: sampleSession }, error: null });
    const { client } = mockAuthClient({ signUp });

    await expect(signUpWithPassword(client, credentials)).resolves.toEqual(
      sampleSession,
    );
    expect(signUp).toHaveBeenCalledWith({
      email: credentials.email,
      password: credentials.password,
    });
  });

  it('returns null when email confirmation is required', async () => {
    const { client } = mockAuthClient({
      signUp: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
    });

    await expect(signUpWithPassword(client, credentials)).resolves.toBeNull();
  });

  it('throws a clear error that does not leak provider internals', async () => {
    const { client } = mockAuthClient({
      signUp: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: authError }),
    });

    const error = await signUpWithPassword(client, credentials).catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('could not register this account');
    expect((error as Error).message).not.toContain(RAW_LEAK);
    expect((error as Error).cause).toBe(authError);
  });
});

describe('signOut', () => {
  it('resolves on success', async () => {
    const { client, auth } = mockAuthClient({
      signOut: vi.fn().mockResolvedValue({ error: null }),
    });

    await expect(signOut(client)).resolves.toBeUndefined();
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('throws a clear error that does not leak provider internals', async () => {
    const { client } = mockAuthClient({
      signOut: vi.fn().mockResolvedValue({ error: authError }),
    });

    const error = await signOut(client).catch((caught: Error) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('could not sign out');
    expect((error as Error).message).not.toContain(RAW_LEAK);
    expect((error as Error).cause).toBe(authError);
  });
});

describe('getCurrentSession', () => {
  it('returns the current session on success', async () => {
    const { client } = mockAuthClient({
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: sampleSession }, error: null }),
    });

    await expect(getCurrentSession(client)).resolves.toEqual(sampleSession);
  });

  it('returns null when there is no session', async () => {
    const { client } = mockAuthClient({
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
    });

    await expect(getCurrentSession(client)).resolves.toBeNull();
  });

  it('throws a clear error that does not leak provider internals', async () => {
    const { client } = mockAuthClient({
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: authError }),
    });

    const error = await getCurrentSession(client).catch(
      (caught: Error) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('could not read the current session');
    expect((error as Error).message).not.toContain(RAW_LEAK);
    expect((error as Error).cause).toBe(authError);
  });
});

describe('getCurrentUser', () => {
  it('returns the current user on success', async () => {
    const { client } = mockAuthClient({
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: sampleUser }, error: null }),
    });

    await expect(getCurrentUser(client)).resolves.toEqual(sampleUser);
  });

  it('returns null when there is no user', async () => {
    const { client } = mockAuthClient({
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: null }, error: null }),
    });

    await expect(getCurrentUser(client)).resolves.toBeNull();
  });

  it('throws a clear error that does not leak provider internals', async () => {
    const { client } = mockAuthClient({
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: null }, error: authError }),
    });

    const error = await getCurrentUser(client).catch((caught: Error) => caught);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('could not read the current user');
    expect((error as Error).message).not.toContain(RAW_LEAK);
    expect((error as Error).cause).toBe(authError);
  });
});

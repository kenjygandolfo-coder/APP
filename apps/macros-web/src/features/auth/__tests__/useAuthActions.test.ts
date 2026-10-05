import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { Database } from '../../../data/database.types';
import { makeLoginSubmit, makeRegisterSubmit } from '../useAuthActions';
import type { LoginValues, RegisterValues } from '../schemas/auth.schema';

type Client = SupabaseClient<Database>;

const signInWithPassword = vi.fn();
const signUp = vi.fn();

function makeMockClient(): Client {
  return { auth: { signInWithPassword, signUp } } as unknown as Client;
}

const LOGIN: LoginValues = {
  email: 'ana@ejemplo.com',
  password: 'superSecreta1',
};

const REGISTER: RegisterValues = {
  email: 'nuevo@ejemplo.com',
  password: 'superSecreta1',
  confirmPassword: 'superSecreta1',
};

describe('useAuthActions handlers', () => {
  it('makeLoginSubmit forwards email + password to signInWithPassword', async () => {
    signInWithPassword.mockResolvedValueOnce({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    const client = makeMockClient();

    await makeLoginSubmit(client)(LOGIN);

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: LOGIN.email,
      password: LOGIN.password,
    });
  });

  it('makeRegisterSubmit maps RegisterValues and DROPS confirmPassword', async () => {
    signUp.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });
    const client = makeMockClient();

    await makeRegisterSubmit(client)(REGISTER);

    expect(signUp).toHaveBeenCalledWith({
      email: REGISTER.email,
      password: REGISTER.password,
    });
    const [arg] = signUp.mock.calls[0] as [Record<string, unknown>];
    expect(arg).not.toHaveProperty('confirmPassword');
  });

  it('propagates sign-in errors from the data layer', async () => {
    signInWithPassword.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });
    const client = makeMockClient();

    await expect(makeLoginSubmit(client)(LOGIN)).rejects.toThrow(/auth:/);
  });

  it('propagates sign-up errors from the data layer', async () => {
    signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'User already registered' },
    });
    const client = makeMockClient();

    await expect(makeRegisterSubmit(client)(REGISTER)).rejects.toThrow(/auth:/);
  });
});

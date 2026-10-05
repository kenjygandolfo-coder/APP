import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();
const readSupabaseEnvMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock('../env', () => ({
  readSupabaseEnv: () => readSupabaseEnvMock(),
}));

describe('getSupabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    readSupabaseEnvMock.mockReturnValue({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
    createClientMock.mockImplementation(() => ({ id: 'client' }));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('creates the client lazily from the validated env', async () => {
    const { getSupabaseClient } = await import('../supabaseClient');

    const client = getSupabaseClient();

    expect(readSupabaseEnvMock).toHaveBeenCalledTimes(1);
    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
    );
    expect(client).toEqual({ id: 'client' });
  });

  it('memoizes the client across calls', async () => {
    const { getSupabaseClient } = await import('../supabaseClient');

    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { readSupabaseEnv } from '../env';

describe('readSupabaseEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns a frozen config when both vars are present', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

    const env = readSupabaseEnv();

    expect(env).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('trims surrounding whitespace from the values', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '  https://example.supabase.co  ');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '  anon-key  ');

    expect(readSupabaseEnv()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
  });

  it('throws naming every missing variable without leaking values', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    expect(() => readSupabaseEnv()).toThrow(/VITE_SUPABASE_URL/);
    expect(() => readSupabaseEnv()).toThrow(/VITE_SUPABASE_ANON_KEY/);
  });

  it('throws for a single missing variable', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    expect(() => readSupabaseEnv()).toThrow(/VITE_SUPABASE_ANON_KEY/);
    expect(() => readSupabaseEnv()).not.toThrow(/VITE_SUPABASE_URL,/);
  });

  it('treats undefined env vars as missing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined as unknown as string);
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined as unknown as string);

    expect(() => readSupabaseEnv()).toThrow(/VITE_SUPABASE_URL/);
    expect(() => readSupabaseEnv()).toThrow(/VITE_SUPABASE_ANON_KEY/);
  });
});

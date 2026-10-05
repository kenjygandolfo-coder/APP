import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useAuthStorage } from '../useAuthStorage';

describe('useAuthStorage', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('exposes the three storage methods', () => {
    const { result } = renderHook(() => useAuthStorage());

    expect(typeof result.current.saveToken).toBe('function');
    expect(typeof result.current.getToken).toBe('function');
    expect(typeof result.current.deleteToken).toBe('function');
  });

  it('returns a stable instance across renders (memoized)', () => {
    const { result, rerender } = renderHook(() => useAuthStorage());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('round-trips through the web implementation under jsdom', async () => {
    const { result } = renderHook(() => useAuthStorage());

    await result.current.saveToken('jwt-hook-123');
    await expect(result.current.getToken()).resolves.toBe('jwt-hook-123');

    await result.current.deleteToken();
    await expect(result.current.getToken()).resolves.toBeNull();
  });
});

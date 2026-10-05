import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QueryProvider } from '../QueryProvider';
import { appQueryClient, createAppQueryClient } from '../queryClient';

describe('createAppQueryClient', () => {
  it('builds a QueryClient with a non-zero staleTime default', () => {
    const client = createAppQueryClient();

    expect(client).toBeInstanceOf(QueryClient);
    expect(client.getDefaultOptions().queries?.staleTime).toBe(30_000);
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(
      false,
    );
  });

  it('exports a shared singleton instance', () => {
    expect(appQueryClient).toBeInstanceOf(QueryClient);
  });
});

describe('QueryProvider', () => {
  it('provides the shared client to descendants', () => {
    const { result } = renderHook(() => useQueryClient(), {
      wrapper: ({ children }) => <QueryProvider>{children}</QueryProvider>,
    });

    expect(result.current).toBe(appQueryClient);
  });
});

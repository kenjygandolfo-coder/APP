import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { foodLogKeys } from '../queryKeys';
import type { AddFoodLogInput, FoodLog } from '../types';
import { useAddFoodLog } from '../useAddFoodLog';

vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => ({})),
}));

vi.mock('../foodLogs.data', () => ({
  addFoodLog: vi.fn(),
}));

import { addFoodLog } from '../foodLogs.data';

const sampleInput: AddFoodLogInput = {
  user_id: 'user-1',
  name: 'Pollo',
  calories: 300,
};

const savedLog: FoodLog = {
  id: 'log-1',
  user_id: 'user-1',
  logged_on: '2026-02-01',
  name: 'Pollo',
  quantity: 1,
  unit: 'serving',
  calories: 300,
  protein_g: 40,
  fat_g: 8,
  carbs_g: 2,
  created_at: '2026-02-01T08:00:00.000Z',
  updated_at: '2026-02-01T08:00:00.000Z',
};

function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useAddFoodLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions through isPending to success and invalidates the inserted date', async () => {
    let resolveAdd: (log: FoodLog) => void = () => undefined;
    vi.mocked(addFoodLog).mockImplementation(
      () =>
        new Promise<FoodLog>((resolve) => {
          resolveAdd = resolve;
        }),
    );
    const client = createClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useAddFoodLog('user-1'), {
      wrapper: wrapperFor(client),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate(sampleInput);
    await waitFor(() => expect(result.current.isPending).toBe(true));

    resolveAdd(savedLog);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(savedLog);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: foodLogKeys.daily('user-1', savedLog.logged_on),
    });
  });

  it('exposes isError and does not invalidate when the mutation rejects', async () => {
    vi.mocked(addFoodLog).mockRejectedValue(new Error('boom'));
    const client = createClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useAddFoodLog('user-1'), {
      wrapper: wrapperFor(client),
    });

    result.current.mutate(sampleInput);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

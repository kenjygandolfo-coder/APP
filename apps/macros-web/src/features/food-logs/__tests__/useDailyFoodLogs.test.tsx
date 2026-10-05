import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FoodLog } from '../types';
import { useDailyFoodLogs } from '../useDailyFoodLogs';

vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => ({})),
}));

vi.mock('../foodLogs.data', () => ({
  getDailyFoodLogs: vi.fn(),
}));

import { getDailyFoodLogs } from '../foodLogs.data';

const sampleLog: FoodLog = {
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

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useDailyFoodLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions from loading to success with the day logs', async () => {
    vi.mocked(getDailyFoodLogs).mockResolvedValue([sampleLog]);

    const { result } = renderHook(
      () => useDailyFoodLogs('user-1', '2026-02-01'),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([sampleLog]);
  });

  it('exposes isError when the query rejects', async () => {
    vi.mocked(getDailyFoodLogs).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(
      () => useDailyFoodLogs('user-1', '2026-02-01'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('stays idle (disabled) when no userId is provided', () => {
    const { result } = renderHook(
      () => useDailyFoodLogs(null, '2026-02-01'),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(getDailyFoodLogs).not.toHaveBeenCalled();
  });

  it('stays idle (disabled) when no date is provided', () => {
    const { result } = renderHook(() => useDailyFoodLogs('user-1', null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getDailyFoodLogs).not.toHaveBeenCalled();
  });
});

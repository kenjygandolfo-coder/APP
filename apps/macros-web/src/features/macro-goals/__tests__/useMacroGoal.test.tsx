import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MacroGoal } from '../types';
import { useMacroGoal } from '../useMacroGoal';

vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => ({})),
}));

vi.mock('../macroGoals.data', () => ({
  getActiveMacroGoal: vi.fn(),
}));

import { getActiveMacroGoal } from '../macroGoals.data';

const sampleGoal: MacroGoal = {
  id: 'goal-1',
  user_id: 'user-1',
  goal_type: 'deficit',
  tdee: 2200,
  calorie_target: 1900,
  protein_g: 150,
  fat_g: 60,
  carbs_g: 200,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
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

describe('useMacroGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions from loading to success with mapped data', async () => {
    vi.mocked(getActiveMacroGoal).mockResolvedValue(sampleGoal);

    const { result } = renderHook(() => useMacroGoal('user-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(sampleGoal);
  });

  it('exposes isError when the query rejects', async () => {
    vi.mocked(getActiveMacroGoal).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useMacroGoal('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('stays idle (disabled) when no userId is provided', () => {
    const { result } = renderHook(() => useMacroGoal(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getActiveMacroGoal).not.toHaveBeenCalled();
  });
});

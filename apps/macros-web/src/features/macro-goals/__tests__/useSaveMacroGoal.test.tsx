import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { macroGoalKeys } from '../queryKeys';
import type { MacroGoal, SaveMacroGoalInput } from '../types';
import { useSaveMacroGoal } from '../useSaveMacroGoal';

vi.mock('../../../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(() => ({})),
}));

vi.mock('../macroGoals.data', () => ({
  saveMacroGoal: vi.fn(),
}));

import { saveMacroGoal } from '../macroGoals.data';

const sampleInput: SaveMacroGoalInput = {
  user_id: 'user-1',
  goal_type: 'deficit',
  tdee: 2200,
  calorie_target: 1900,
  protein_g: 150,
  fat_g: 60,
  carbs_g: 200,
};

const savedGoal: MacroGoal = {
  id: 'goal-1',
  ...sampleInput,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
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

describe('useSaveMacroGoal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('transitions through isPending to success and invalidates the active query', async () => {
    let resolveSave: (goal: MacroGoal) => void = () => undefined;
    vi.mocked(saveMacroGoal).mockImplementation(
      () =>
        new Promise<MacroGoal>((resolve) => {
          resolveSave = resolve;
        }),
    );
    const client = createClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useSaveMacroGoal('user-1'), {
      wrapper: wrapperFor(client),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate(sampleInput);
    await waitFor(() => expect(result.current.isPending).toBe(true));

    resolveSave(savedGoal);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(savedGoal);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: macroGoalKeys.active('user-1'),
    });
  });

  it('exposes isError and does not invalidate when the mutation rejects', async () => {
    vi.mocked(saveMacroGoal).mockRejectedValue(new Error('boom'));
    const client = createClient();
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useSaveMacroGoal('user-1'), {
      wrapper: wrapperFor(client),
    });

    result.current.mutate(sampleInput);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

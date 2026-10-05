import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { getSupabaseClient } from '../../lib/supabaseClient';
import { saveMacroGoal } from './macroGoals.data';
import { macroGoalKeys } from './queryKeys';
import type { MacroGoal, SaveMacroGoalInput } from './types';

/**
 * Persist the user's macro goal with TanStack Query. On success the active
 * macro-goal query is invalidated so {@link useMacroGoal} refetches the newly
 * saved goal.
 *
 * Exposes the standard mutation handles (`mutate`, `mutateAsync`, `isPending`,
 * `isError`, `error`).
 */
export function useSaveMacroGoal(
  userId: string | null | undefined,
): UseMutationResult<MacroGoal, Error, SaveMacroGoalInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveMacroGoalInput) =>
      saveMacroGoal(getSupabaseClient(), input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: macroGoalKeys.active(userId),
      }),
  });
}

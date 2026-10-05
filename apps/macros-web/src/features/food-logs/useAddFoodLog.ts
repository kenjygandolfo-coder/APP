import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';

import { getSupabaseClient } from '../../lib/supabaseClient';
import { addFoodLog } from './foodLogs.data';
import { foodLogKeys } from './queryKeys';
import type { AddFoodLogInput, FoodLog } from './types';

/**
 * Insert a food log with TanStack Query. On success the daily query for the
 * INSERTED row's `logged_on` is invalidated so {@link useDailyFoodLogs}
 * refetches exactly the affected date (and no other cached day).
 *
 * Exposes the standard mutation handles (`mutate`, `mutateAsync`, `isPending`,
 * `isError`, `error`).
 */
export function useAddFoodLog(
  userId: string | null | undefined,
): UseMutationResult<FoodLog, Error, AddFoodLogInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddFoodLogInput) =>
      addFoodLog(getSupabaseClient(), input),
    onSuccess: (saved) =>
      queryClient.invalidateQueries({
        queryKey: foodLogKeys.daily(userId, saved.logged_on),
      }),
  });
}

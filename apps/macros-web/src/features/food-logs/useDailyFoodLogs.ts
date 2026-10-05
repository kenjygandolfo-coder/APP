import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getSupabaseClient } from '../../lib/supabaseClient';
import { getDailyFoodLogs } from './foodLogs.data';
import { foodLogKeys } from './queryKeys';
import type { FoodLog } from './types';

/**
 * Read a user's food logs for a single calendar date with TanStack Query (no
 * `useEffect` for fetching). The query is disabled until BOTH a `userId` and a
 * `date` are known, so passing `null`/`undefined` is safe and simply stays
 * idle.
 *
 * Exposes the standard query flags (`data`, `isLoading`, `isError`, `error`).
 */
export function useDailyFoodLogs(
  userId: string | null | undefined,
  date: string | null | undefined,
): UseQueryResult<FoodLog[], Error> {
  return useQuery({
    queryKey: foodLogKeys.daily(userId, date),
    queryFn: () =>
      getDailyFoodLogs(getSupabaseClient(), userId as string, date as string),
    enabled: Boolean(userId) && Boolean(date),
  });
}

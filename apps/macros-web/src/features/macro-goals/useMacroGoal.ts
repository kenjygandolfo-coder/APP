import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { getSupabaseClient } from '../../lib/supabaseClient';
import { getActiveMacroGoal } from './macroGoals.data';
import { macroGoalKeys } from './queryKeys';
import type { MacroGoal } from './types';

/**
 * Read the current user's active macro goal with TanStack Query (no
 * `useEffect` for fetching). The query is disabled until a `userId` is known,
 * so passing `null`/`undefined` is safe and simply stays idle.
 *
 * Exposes the standard query flags (`data`, `isLoading`, `isError`, `error`).
 */
export function useMacroGoal(
  userId: string | null | undefined,
): UseQueryResult<MacroGoal | null, Error> {
  return useQuery({
    queryKey: macroGoalKeys.active(userId),
    queryFn: () => getActiveMacroGoal(getSupabaseClient(), userId as string),
    enabled: Boolean(userId),
  });
}

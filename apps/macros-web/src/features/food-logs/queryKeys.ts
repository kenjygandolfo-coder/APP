/**
 * Centralised, frozen TanStack Query key factory for food logs. Keeping the
 * keys in one place means the read hook and the mutation's invalidation always
 * agree on the exact tuple, so a successful insert reliably refreshes the right
 * day's logs.
 *
 * Keyed by BOTH `userId` AND `date` so invalidation is precise per date: adding
 * a log for one day never forces a refetch of another day's cached query.
 */
export const foodLogKeys = Object.freeze({
  /** Key for a user's food logs on a specific calendar date (`logged_on`). */
  daily: (
    userId: string | null | undefined,
    date: string | null | undefined,
  ) => ['food-logs', 'daily', userId, date] as const,
});

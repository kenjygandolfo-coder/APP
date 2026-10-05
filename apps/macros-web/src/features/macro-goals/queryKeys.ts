/**
 * Centralised, frozen TanStack Query key factory for macro goals. Keeping the
 * keys in one place means the read hook and the mutation's invalidation always
 * agree on the exact tuple, so a successful save reliably refreshes the active
 * goal query.
 */
export const macroGoalKeys = Object.freeze({
  /** Key for a user's single active macro goal. */
  active: (userId: string | null | undefined) =>
    ['macro-goal', 'active', userId] as const,
});

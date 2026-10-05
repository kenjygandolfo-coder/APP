import { QueryClient } from '@tanstack/react-query';

/**
 * Shared application QueryClient.
 *
 * A single staleTime keeps the active macro goal cached briefly so quick
 * view switches do not refetch. Tests MUST NOT reuse this instance: they build
 * their own QueryClient with `retry: false` so rejected queries/mutations
 * settle immediately instead of retrying.
 */
export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/** The process-wide client used by the real app root. */
export const appQueryClient = createAppQueryClient();

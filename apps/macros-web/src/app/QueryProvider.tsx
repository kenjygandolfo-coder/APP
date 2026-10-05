import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { appQueryClient } from './queryClient';

interface QueryProviderProps {
  readonly children: ReactNode;
}

/**
 * Wraps the app in a {@link QueryClientProvider} using the shared
 * {@link appQueryClient}. Mounted once at the root so every feature can use
 * TanStack Query hooks.
 */
export function QueryProvider({ children }: QueryProviderProps): JSX.Element {
  return (
    <QueryClientProvider client={appQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

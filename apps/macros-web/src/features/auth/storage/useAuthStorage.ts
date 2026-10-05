/**
 * React hook exposing the platform-appropriate token storage. The underlying
 * implementation is created once and memoized so the same stable instance is
 * reused across renders.
 */
import { useMemo } from 'react';

import { createTokenStorage } from './platform';
import type { TokenStorage } from './types';

export function useAuthStorage(): TokenStorage {
  return useMemo<TokenStorage>(() => createTokenStorage(), []);
}

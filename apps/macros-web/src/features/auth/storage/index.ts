/**
 * Public surface of the platform-adaptive secure token storage.
 */
export type { TokenStorage } from './types';
export { TOKEN_STORAGE_KEY } from './types';
export { createTokenStorage, isNativePlatform } from './platform';
export { useAuthStorage } from './useAuthStorage';

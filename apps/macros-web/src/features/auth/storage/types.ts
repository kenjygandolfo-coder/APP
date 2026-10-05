/**
 * Shared contract for persisting the session token (JWT) across platforms.
 * Both the web (localStorage) and native (expo-secure-store) implementations
 * satisfy this interface, so callers depend only on the abstraction.
 */
export interface TokenStorage {
  saveToken(token: string): Promise<void>;
  getToken(): Promise<string | null>;
  deleteToken(): Promise<void>;
}

/**
 * Storage key used by every implementation. This is a key name, not a secret:
 * it simply namespaces the token entry under the app's prefix.
 */
export const TOKEN_STORAGE_KEY = 'fitness.auth.token';

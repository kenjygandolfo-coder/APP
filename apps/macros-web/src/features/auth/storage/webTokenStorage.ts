/**
 * Web token storage backed by window.localStorage.
 *
 * SECURITY TRADE-OFF: localStorage is readable by any script running on the
 * same origin, which means a successful XSS attack can exfiltrate the stored
 * token. This is the pragmatic WEB fallback where no OS keystore exists. The
 * hardened path on mobile is the device Keychain/Keystore via expo-secure-store
 * (see nativeTokenStorage.ts), which this interface selects at runtime.
 */
import type { TokenStorage } from './types';
import { TOKEN_STORAGE_KEY } from './types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export const webTokenStorage: TokenStorage = {
  async saveToken(token: string): Promise<void> {
    if (!isNonEmptyString(token)) {
      throw new Error('No se pudo guardar el token: el valor debe ser un texto no vacío.');
    }

    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      throw new Error('No se pudo guardar el token de sesión.');
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      throw new Error('No se pudo recuperar el token de sesión.');
    }
  },

  async deleteToken(): Promise<void> {
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      throw new Error('No se pudo eliminar el token de sesión.');
    }
  },
};

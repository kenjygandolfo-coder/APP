/**
 * Native token storage backed by expo-secure-store (device Keychain on iOS,
 * Keystore on Android). This is the hardened path for the Expo app and the
 * counterpart to the web localStorage fallback.
 *
 * INSTALL (in the Expo app, NOT in this web module):
 *   npx expo install expo-secure-store
 *
 * expo-secure-store is intentionally NOT a dependency of macros-web. Each
 * method performs a LAZY dynamic import via a runtime-computed specifier so the
 * Vite web bundler never tries to resolve the package at build time, and this
 * code never executes under the DOM module (platform selection routes web
 * callers to webTokenStorage instead).
 */
import type { TokenStorage } from './types';
import { TOKEN_STORAGE_KEY } from './types';

/** Minimal shape of the expo-secure-store API consumed here. */
interface ExpoSecureStore {
  setItemAsync(key: string, value: string): Promise<void>;
  getItemAsync(key: string): Promise<string | null>;
  deleteItemAsync(key: string): Promise<void>;
}

// Computed at runtime so TypeScript/Vite do not statically resolve the module
// (expo-secure-store is only present in the native Expo environment).
const SECURE_STORE_MODULE = 'expo-secure-store';

async function loadSecureStore(): Promise<ExpoSecureStore> {
  const mod = (await import(/* @vite-ignore */ SECURE_STORE_MODULE)) as ExpoSecureStore;
  return mod;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export const nativeTokenStorage: TokenStorage = {
  async saveToken(token: string): Promise<void> {
    if (!isNonEmptyString(token)) {
      throw new Error('No se pudo guardar el token: el valor debe ser un texto no vacío.');
    }

    try {
      const secureStore = await loadSecureStore();
      await secureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    } catch {
      throw new Error('No se pudo guardar el token de sesión.');
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const secureStore = await loadSecureStore();
      return await secureStore.getItemAsync(TOKEN_STORAGE_KEY);
    } catch {
      throw new Error('No se pudo recuperar el token de sesión.');
    }
  },

  async deleteToken(): Promise<void> {
    try {
      const secureStore = await loadSecureStore();
      await secureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    } catch {
      throw new Error('No se pudo eliminar el token de sesión.');
    }
  },
};

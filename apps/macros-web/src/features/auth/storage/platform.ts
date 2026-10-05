/**
 * Runtime platform detection and token-storage selection. Pure, tiny helpers
 * so the active TokenStorage implementation is chosen once per environment.
 */
import { nativeTokenStorage } from './nativeTokenStorage';
import type { TokenStorage } from './types';
import { webTokenStorage } from './webTokenStorage';

/**
 * Detects a React Native runtime. React Native sets navigator.product to
 * 'ReactNative'; a browser (or jsdom) leaves it as 'Gecko'. The absence of a
 * window object is treated as native as a defensive fallback.
 */
export function isNativePlatform(): boolean {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return true;
  }

  return typeof window === 'undefined';
}

/**
 * Returns the TokenStorage implementation for the current platform: the
 * expo-secure-store-backed native impl on React Native, otherwise the
 * localStorage-backed web impl.
 */
export function createTokenStorage(): TokenStorage {
  return isNativePlatform() ? nativeTokenStorage : webTokenStorage;
}

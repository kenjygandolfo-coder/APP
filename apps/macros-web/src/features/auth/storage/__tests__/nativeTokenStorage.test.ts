import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TOKEN_STORAGE_KEY } from '../types';

const setItemAsync = vi.fn<(key: string, value: string) => Promise<void>>();
const getItemAsync = vi.fn<(key: string) => Promise<string | null>>();
const deleteItemAsync = vi.fn<(key: string) => Promise<void>>();

// Supply a virtual expo-secure-store so the lazy dynamic import resolves under
// Vitest even though the package is not installed in this web module.
vi.mock('expo-secure-store', () => ({
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
}));

describe('nativeTokenStorage', () => {
  beforeEach(() => {
    setItemAsync.mockReset();
    getItemAsync.mockReset();
    deleteItemAsync.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('saveToken writes to expo-secure-store under the shared key', async () => {
    setItemAsync.mockResolvedValue();
    const { nativeTokenStorage } = await import('../nativeTokenStorage');

    await nativeTokenStorage.saveToken('jwt-native-123');

    expect(setItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY, 'jwt-native-123');
  });

  it('getToken reads from expo-secure-store', async () => {
    getItemAsync.mockResolvedValue('jwt-native-get');
    const { nativeTokenStorage } = await import('../nativeTokenStorage');

    await expect(nativeTokenStorage.getToken()).resolves.toBe('jwt-native-get');
    expect(getItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
  });

  it('deleteToken removes from expo-secure-store', async () => {
    deleteItemAsync.mockResolvedValue();
    const { nativeTokenStorage } = await import('../nativeTokenStorage');

    await nativeTokenStorage.deleteToken();

    expect(deleteItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
  });

  it('rejects saving an empty string before touching the store', async () => {
    const { nativeTokenStorage } = await import('../nativeTokenStorage');

    await expect(nativeTokenStorage.saveToken('')).rejects.toThrow();
    expect(setItemAsync).not.toHaveBeenCalled();
  });

  it('surfaces a descriptive error when the store rejects on save', async () => {
    setItemAsync.mockRejectedValue(new Error('keystore unavailable'));
    const { nativeTokenStorage } = await import('../nativeTokenStorage');

    await expect(nativeTokenStorage.saveToken('jwt-fail')).rejects.toThrow(
      /no se pudo guardar/i,
    );
  });

  it('surfaces a descriptive error when the store rejects on get', async () => {
    getItemAsync.mockRejectedValue(new Error('keychain read error'));
    const { nativeTokenStorage } = await import('../nativeTokenStorage');

    await expect(nativeTokenStorage.getToken()).rejects.toThrow(
      /no se pudo recuperar/i,
    );
  });

  it('surfaces a descriptive error when the store rejects on delete', async () => {
    deleteItemAsync.mockRejectedValue(new Error('keychain delete error'));
    const { nativeTokenStorage } = await import('../nativeTokenStorage');

    await expect(nativeTokenStorage.deleteToken()).rejects.toThrow(
      /no se pudo eliminar/i,
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TOKEN_STORAGE_KEY } from '../types';
import { webTokenStorage } from '../webTokenStorage';

describe('webTokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('round-trips a token: saveToken then getToken returns it', async () => {
    await webTokenStorage.saveToken('jwt-abc-123');

    await expect(webTokenStorage.getToken()).resolves.toBe('jwt-abc-123');
  });

  it('persists under the shared TOKEN_STORAGE_KEY', async () => {
    await webTokenStorage.saveToken('jwt-key-check');

    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('jwt-key-check');
  });

  it('returns null when no token has been saved', async () => {
    await expect(webTokenStorage.getToken()).resolves.toBeNull();
  });

  it('deleteToken clears the token so getToken returns null', async () => {
    await webTokenStorage.saveToken('jwt-to-delete');
    await webTokenStorage.deleteToken();

    await expect(webTokenStorage.getToken()).resolves.toBeNull();
  });

  it('rejects when saving an empty string', async () => {
    await expect(webTokenStorage.saveToken('')).rejects.toThrow();
  });

  it('rejects when saving a whitespace-only token', async () => {
    await expect(webTokenStorage.saveToken('   ')).rejects.toThrow();
  });

  it('rejects when saving a non-string token', async () => {
    await expect(
      webTokenStorage.saveToken(undefined as unknown as string),
    ).rejects.toThrow();
  });

  it('surfaces a descriptive error when setItem throws', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    await expect(webTokenStorage.saveToken('jwt-will-fail')).rejects.toThrow(
      /no se pudo guardar/i,
    );
  });

  it('surfaces a descriptive error when getItem throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('read failure');
    });

    await expect(webTokenStorage.getToken()).rejects.toThrow(
      /no se pudo recuperar/i,
    );
  });

  it('surfaces a descriptive error when removeItem throws', async () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('remove failure');
    });

    await expect(webTokenStorage.deleteToken()).rejects.toThrow(
      /no se pudo eliminar/i,
    );
  });
});

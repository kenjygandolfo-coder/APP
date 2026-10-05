import { afterEach, describe, expect, it } from 'vitest';

import { createTokenStorage, isNativePlatform } from '../platform';

describe('isNativePlatform', () => {
  const originalProduct = Object.getOwnPropertyDescriptor(
    window.navigator,
    'product',
  );

  afterEach(() => {
    if (originalProduct) {
      Object.defineProperty(window.navigator, 'product', originalProduct);
    } else {
      delete (window.navigator as { product?: string }).product;
    }
  });

  it('is false under jsdom (web environment)', () => {
    expect(isNativePlatform()).toBe(false);
  });

  it('is true when navigator.product is stubbed to ReactNative', () => {
    Object.defineProperty(window.navigator, 'product', {
      value: 'ReactNative',
      configurable: true,
    });

    expect(isNativePlatform()).toBe(true);
  });
});

describe('createTokenStorage', () => {
  it('returns an object exposing saveToken/getToken/deleteToken', () => {
    const storage = createTokenStorage();

    expect(typeof storage.saveToken).toBe('function');
    expect(typeof storage.getToken).toBe('function');
    expect(typeof storage.deleteToken).toBe('function');
  });

  it('returns the web implementation under jsdom (round-trips via localStorage)', async () => {
    const storage = createTokenStorage();

    await storage.saveToken('jwt-from-factory');
    await expect(storage.getToken()).resolves.toBe('jwt-from-factory');

    await storage.deleteToken();
    await expect(storage.getToken()).resolves.toBeNull();
  });
});

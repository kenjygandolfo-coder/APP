import { describe, expect, it } from 'vitest';

import * as storage from '../index';

describe('storage barrel', () => {
  it('re-exports the public surface', () => {
    expect(storage.TOKEN_STORAGE_KEY).toBe('fitness.auth.token');
    expect(typeof storage.createTokenStorage).toBe('function');
    expect(typeof storage.isNativePlatform).toBe('function');
    expect(typeof storage.useAuthStorage).toBe('function');
  });
});

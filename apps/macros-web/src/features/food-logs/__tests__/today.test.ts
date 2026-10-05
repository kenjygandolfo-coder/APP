import { describe, expect, it } from 'vitest';

import { localToday } from '../today';

describe('localToday', () => {
  it('formats a yyyy-mm-dd string from LOCAL date parts (not UTC)', () => {
    // 2026-03-07 at 23:30 in the local zone. Building from local parts must
    // yield the local calendar day, never a UTC-shifted one.
    const now = new Date(2026, 2, 7, 23, 30, 0);
    expect(localToday(now)).toBe('2026-03-07');
  });

  it('zero-pads single-digit months and days', () => {
    const now = new Date(2026, 0, 5, 9, 0, 0);
    expect(localToday(now)).toBe('2026-01-05');
  });

  it('uses local date parts even late at night (no UTC day-shift)', () => {
    // A late-night local time must stay on its local day. toISOString() would
    // roll this forward to the next UTC day for positive-offset zones; the
    // helper must not. We assert the day component matches getDate().
    const now = new Date(2026, 11, 31, 22, 15, 0);
    const expectedDay = String(now.getDate()).padStart(2, '0');
    expect(localToday(now).endsWith(`-${expectedDay}`)).toBe(true);
    expect(localToday(now)).toBe('2026-12-31');
  });

  it('defaults to the current date when called without an argument', () => {
    const expected = localToday(new Date());
    expect(localToday()).toBe(expected);
    expect(localToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

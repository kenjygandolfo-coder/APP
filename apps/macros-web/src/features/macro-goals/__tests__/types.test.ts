import { describe, expect, it } from 'vitest';

import { GOAL_TYPES } from '../types';

describe('GOAL_TYPES', () => {
  it('lists the three ASCII goal types in order', () => {
    expect(GOAL_TYPES).toEqual(['deficit', 'mantenimiento', 'volumen']);
  });

  it('is frozen so it cannot be mutated', () => {
    expect(Object.isFrozen(GOAL_TYPES)).toBe(true);
  });
});

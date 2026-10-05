import { describe, expect, it } from 'vitest';

import type { MacroResult } from '../../../domain';
import { toSaveMacroGoalInput } from '../toSaveMacroGoalInput';

const USER_ID = '11111111-1111-1111-1111-111111111111';

const RESULT: MacroResult = Object.freeze({
  calorieTarget: 2200,
  tdee: 2199.6,
  protein: Object.freeze({ grams: 165, kcal: 660, percent: 30 }),
  fat: Object.freeze({ grams: 61, kcal: 549, percent: 25 }),
  carbs: Object.freeze({ grams: 248, kcal: 992, percent: 45 }),
});

describe('toSaveMacroGoalInput', () => {
  it('maps a MacroResult + userId into the persisted insert shape', () => {
    const input = toSaveMacroGoalInput(USER_ID, RESULT);

    expect(input).toEqual({
      user_id: USER_ID,
      goal_type: 'mantenimiento',
      tdee: 2200, // rounded from 2199.6 to match the integer column
      calorie_target: 2200,
      protein_g: 165,
      fat_g: 61,
      carbs_g: 248,
    });
  });

  it('does not mutate the source result', () => {
    const snapshot = JSON.stringify(RESULT);
    toSaveMacroGoalInput(USER_ID, RESULT);
    expect(JSON.stringify(RESULT)).toBe(snapshot);
  });

  it('omits is_active so the save strategy sets the single-active invariant', () => {
    const input = toSaveMacroGoalInput(USER_ID, RESULT);
    expect('is_active' in input).toBe(false);
  });
});

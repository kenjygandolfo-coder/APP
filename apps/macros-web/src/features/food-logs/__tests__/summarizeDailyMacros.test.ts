import { describe, expect, it } from 'vitest';

import type { MacroGoal } from '../../macro-goals/types';
import { summarizeDailyMacros } from '../summarizeDailyMacros';
import type { FoodLog } from '../types';

function makeLog(partial: Partial<FoodLog>): FoodLog {
  return {
    id: 'log',
    user_id: 'user-1',
    logged_on: '2026-02-01',
    name: 'item',
    quantity: 1,
    unit: 'serving',
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    created_at: '2026-02-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
    ...partial,
  };
}

const goal: MacroGoal = {
  id: 'goal-1',
  user_id: 'user-1',
  goal_type: 'deficit',
  tdee: 2200,
  calorie_target: 2000,
  protein_g: 150,
  fat_g: 60,
  carbs_g: 200,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('summarizeDailyMacros', () => {
  it('empty logs: zero consumed, remaining equals targets, percent 0', () => {
    const summary = summarizeDailyMacros([], goal);

    expect(summary.consumed).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
    expect(summary.remaining).toEqual({
      calories: 2000,
      protein: 150,
      fat: 60,
      carbs: 200,
    });
    expect(summary.percent).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
    expect(summary.hasGoal).toBe(true);
  });

  it('partial consumption: sums logs and computes remaining/percent', () => {
    const logs: FoodLog[] = [
      makeLog({ calories: 500, protein_g: 30, fat_g: 10, carbs_g: 50 }),
      makeLog({ calories: 500, protein_g: 45, fat_g: 20, carbs_g: 50 }),
    ];

    const summary = summarizeDailyMacros(logs, goal);

    expect(summary.consumed).toEqual({
      calories: 1000,
      protein: 75,
      fat: 30,
      carbs: 100,
    });
    expect(summary.remaining).toEqual({
      calories: 1000,
      protein: 75,
      fat: 30,
      carbs: 100,
    });
    expect(summary.percent).toEqual({
      calories: 50,
      protein: 50,
      fat: 50,
      carbs: 50,
    });
  });

  it('exactly at goal: remaining 0 and percent 100', () => {
    const logs: FoodLog[] = [
      makeLog({ calories: 2000, protein_g: 150, fat_g: 60, carbs_g: 200 }),
    ];

    const summary = summarizeDailyMacros(logs, goal);

    expect(summary.remaining).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
    expect(summary.percent).toEqual({
      calories: 100,
      protein: 100,
      fat: 100,
      carbs: 100,
    });
  });

  it('over goal: remaining goes negative but percent is clamped to 100', () => {
    const logs: FoodLog[] = [
      makeLog({ calories: 2500, protein_g: 200, fat_g: 80, carbs_g: 260 }),
    ];

    const summary = summarizeDailyMacros(logs, goal);

    expect(summary.remaining).toEqual({
      calories: -500,
      protein: -50,
      fat: -20,
      carbs: -60,
    });
    expect(summary.percent).toEqual({
      calories: 100,
      protein: 100,
      fat: 100,
      carbs: 100,
    });
  });

  it('null goal: targets 0, remaining mirrors negative consumed, no NaN', () => {
    const logs: FoodLog[] = [
      makeLog({ calories: 300, protein_g: 20, fat_g: 5, carbs_g: 10 }),
    ];

    const summary = summarizeDailyMacros(logs, null);

    expect(summary.hasGoal).toBe(false);
    expect(summary.consumed).toEqual({
      calories: 300,
      protein: 20,
      fat: 5,
      carbs: 10,
    });
    expect(summary.remaining).toEqual({
      calories: -300,
      protein: -20,
      fat: -5,
      carbs: -10,
    });
    expect(summary.percent).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    });
    for (const value of Object.values(summary.percent)) {
      expect(Number.isNaN(value)).toBe(false);
    }
  });

  it('does not mutate the input logs array', () => {
    const logs: FoodLog[] = [makeLog({ calories: 100 })];
    const snapshot = [...logs];

    summarizeDailyMacros(logs, goal);

    expect(logs).toEqual(snapshot);
  });
});

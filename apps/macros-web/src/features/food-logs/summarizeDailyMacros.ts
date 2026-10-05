import type { MacroGoal } from '../macro-goals/types';
import type { FoodLog } from './types';

/** The four macro metrics the daily dashboard tracks. */
export type MacroMetric = 'calories' | 'protein' | 'fat' | 'carbs';

/** A value per macro metric (consumed totals, remaining amounts, or percents). */
export type MacroTotals = Readonly<Record<MacroMetric, number>>;

/** The pure summary a day's logs produce when compared against a goal. */
export interface DailyMacroSummary {
  /** Immutable sum of everything logged today. */
  readonly consumed: MacroTotals;
  /** target - consumed per metric. MAY be negative (never clamped). */
  readonly remaining: MacroTotals;
  /** consumed/target as a percent, ALWAYS clamped to [0, 100]. */
  readonly percent: MacroTotals;
  /** Whether a goal was supplied (targets are all 0 when false). */
  readonly hasGoal: boolean;
}

/** Frozen zero totals used as the immutable reduce seed and the null-goal targets. */
const ZERO_TOTALS: MacroTotals = Object.freeze({
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
});

/** Clamp `value` into the inclusive `[min, max]` range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Sum all logs into a fresh totals object without mutating the accumulator. */
function sumConsumed(logs: readonly FoodLog[]): MacroTotals {
  return logs.reduce<MacroTotals>(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein_g,
      fat: acc.fat + log.fat_g,
      carbs: acc.carbs + log.carbs_g,
    }),
    ZERO_TOTALS,
  );
}

/** Map a goal (or null) to per-metric targets; null yields all-zero targets. */
function goalTargets(goal: MacroGoal | null): MacroTotals {
  if (goal === null) {
    return ZERO_TOTALS;
  }
  return {
    calories: goal.calorie_target,
    protein: goal.protein_g,
    fat: goal.fat_g,
    carbs: goal.carbs_g,
  };
}

/** Percent consumed of target, clamped to [0, 100]; 0 when target is not positive. */
function percentOf(consumed: number, target: number): number {
  return target > 0 ? clamp((consumed / target) * 100, 0, 100) : 0;
}

/**
 * Pure, React-free daily macro summary.
 *
 * `consumed` is an immutable reduce over the logs. `remaining` is
 * target - consumed per metric and MAY be negative (over-eating is surfaced,
 * not hidden). `percent` is always clamped to [0, 100] for progress bars. A
 * `null` goal is treated as zero targets, so remaining mirrors negative
 * consumed and percent is 0 — never `NaN`.
 */
export function summarizeDailyMacros(
  logs: readonly FoodLog[],
  goal: MacroGoal | null,
): DailyMacroSummary {
  const consumed = sumConsumed(logs);
  const targets = goalTargets(goal);

  const remaining: MacroTotals = {
    calories: targets.calories - consumed.calories,
    protein: targets.protein - consumed.protein,
    fat: targets.fat - consumed.fat,
    carbs: targets.carbs - consumed.carbs,
  };

  const percent: MacroTotals = {
    calories: percentOf(consumed.calories, targets.calories),
    protein: percentOf(consumed.protein, targets.protein),
    fat: percentOf(consumed.fat, targets.fat),
    carbs: percentOf(consumed.carbs, targets.carbs),
  };

  return { consumed, remaining, percent, hasGoal: goal !== null };
}

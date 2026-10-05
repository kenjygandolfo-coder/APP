import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MacroGoal } from '../../macro-goals/types';
import { COPY } from '../copy.es';
import { DailyDashboard } from '../DailyDashboard';
import type { FoodLog } from '../types';

/**
 * Both data hooks are mocked so these tests exercise the dashboard's own
 * loading/error/no-goal/summary logic in isolation (no QueryClient needed).
 */
type GoalQueryShape = {
  data: MacroGoal | null | undefined;
  isLoading: boolean;
  isError: boolean;
};
type LogsQueryShape = {
  data: readonly FoodLog[] | undefined;
  isLoading: boolean;
  isError: boolean;
};

const goalQuery: GoalQueryShape = {
  data: null,
  isLoading: false,
  isError: false,
};
const logsQuery: LogsQueryShape = {
  data: [],
  isLoading: false,
  isError: false,
};

vi.mock('../../macro-goals/useMacroGoal', () => ({
  useMacroGoal: () => goalQuery,
}));

vi.mock('../useDailyFoodLogs', () => ({
  useDailyFoodLogs: () => logsQuery,
}));

const USER_ID = 'user-123';

/** A goal of round numbers so remaining assertions are exact. */
const GOAL: MacroGoal = {
  id: 'goal-1',
  user_id: USER_ID,
  goal_type: 'deficit',
  tdee: 2200,
  calorie_target: 2000,
  protein_g: 150,
  fat_g: 60,
  carbs_g: 200,
  is_active: true,
  created_at: '2026-10-05T00:00:00.000Z',
  updated_at: '2026-10-05T00:00:00.000Z',
} as MacroGoal;

/** Build a FoodLog with the macro fields that matter for summing. */
function makeLog(partial: Partial<FoodLog>): FoodLog {
  return {
    id: 'log-1',
    user_id: USER_ID,
    name: 'Comida',
    quantity: 1,
    unit: 'serving',
    calories: 0,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    logged_on: '2026-10-05',
    created_at: '2026-10-05T00:00:00.000Z',
    updated_at: '2026-10-05T00:00:00.000Z',
    ...partial,
  } as FoodLog;
}

/**
 * Read the "remaining" value for a macro bar. The bar's accessible name is the
 * macro label; its remaining number lives in the header above the track, which
 * is the progressbar's previous sibling's trailing span. Scoping this way
 * avoids collisions with the small "consumed" span (which shares the g suffix).
 */
function remainingTextFor(label: string): string | undefined {
  const bar = screen.getByRole('progressbar', { name: label });
  const header = bar.previousElementSibling;
  const spans = header?.querySelectorAll('span');
  const remainingSpan = spans?.[spans.length - 1];
  return remainingSpan?.textContent ?? undefined;
}

function reset(): void {
  goalQuery.data = null;
  goalQuery.isLoading = false;
  goalQuery.isError = false;
  logsQuery.data = [];
  logsQuery.isLoading = false;
  logsQuery.isError = false;
}

describe('DailyDashboard', () => {
  beforeEach(reset);

  it('shows the cozy loading copy while either query is loading', () => {
    goalQuery.isLoading = true;
    logsQuery.isLoading = true;
    render(<DailyDashboard userId={USER_ID} />);

    expect(screen.getByText(COPY.dashboard.loading)).toBeInTheDocument();
  });

  it('shows friendly error copy and never leaks a raw error', () => {
    goalQuery.isError = true;
    render(<DailyDashboard userId={USER_ID} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(COPY.dashboard.error);
    expect(alert.textContent ?? '').not.toMatch(/postgrest|supabase|Error:/i);
  });

  it('shows the no-goal CTA with no NaN when there is no active goal', () => {
    goalQuery.data = null;
    const { container } = render(<DailyDashboard userId={USER_ID} />);

    expect(screen.getByText(COPY.dashboard.noGoal)).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/NaN/);
  });

  it('shows full remaining targets and an empty hint when logs are empty', () => {
    goalQuery.data = GOAL;
    logsQuery.data = [];
    render(<DailyDashboard userId={USER_ID} />);

    expect(screen.getByText(COPY.dashboard.empty)).toBeInTheDocument();
    // Remaining calories equal the full target.
    expect(screen.getByText('2000')).toBeInTheDocument();
    // Each macro remaining equals its full target (scoped to its bar).
    expect(remainingTextFor(COPY.dashboard.protein)).toBe('150g');
    expect(remainingTextFor(COPY.dashboard.fat)).toBe('60g');
    expect(remainingTextFor(COPY.dashboard.carbs)).toBe('200g');
  });

  it('computes correct remaining numbers when under budget', () => {
    goalQuery.data = GOAL;
    logsQuery.data = [
      makeLog({ calories: 500, protein_g: 40, fat_g: 20, carbs_g: 50 }),
    ];
    render(<DailyDashboard userId={USER_ID} />);

    // Calories: 2000 - 500 = 1500.
    expect(screen.getByText('1500')).toBeInTheDocument();
    // Protein: 150 - 40 = 110; Fat: 60 - 20 = 40; Carbs: 200 - 50 = 150.
    expect(remainingTextFor(COPY.dashboard.protein)).toBe('110g');
    expect(remainingTextFor(COPY.dashboard.fat)).toBe('40g');
    expect(remainingTextFor(COPY.dashboard.carbs)).toBe('150g');
    expect(screen.queryByText(COPY.dashboard.empty)).not.toBeInTheDocument();
  });

  it('shows a negative remaining in the warning accent while the bar stays clamped at 100%', () => {
    goalQuery.data = GOAL;
    // Protein over budget: 200 consumed vs 150 target -> remaining -50.
    logsQuery.data = [
      makeLog({ calories: 2500, protein_g: 200, fat_g: 30, carbs_g: 100 }),
    ];
    render(<DailyDashboard userId={USER_ID} />);

    // Negative remaining protein is shown (not hidden) in the pink accent.
    const remainingProtein = screen.getByText('-50g');
    expect(remainingProtein).toBeInTheDocument();
    expect(remainingProtein.className).toContain('text-pink');

    // The protein progress bar is clamped at 100% width despite being over.
    const proteinBar = screen.getByRole('progressbar', {
      name: COPY.dashboard.protein,
    });
    const fill = proteinBar.firstElementChild as HTMLElement | null;
    expect(fill).not.toBeNull();
    expect(fill?.style.width).toBe('100%');
    expect(proteinBar.getAttribute('aria-valuenow')).toBe('100');

    // Over-budget calories (2000 - 2500 = -500) also surface the warning.
    expect(screen.getByText('-500')).toBeInTheDocument();
    expect(screen.getByText(COPY.dashboard.overBudget)).toBeInTheDocument();
  });
});

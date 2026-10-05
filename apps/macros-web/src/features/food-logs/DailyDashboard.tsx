import { FormCard } from '../macros-wizard/components/FormCard';
import { useMacroGoal } from '../macro-goals/useMacroGoal';
import { MacroProgressBar } from './components/MacroProgressBar';
import { COPY } from './copy.es';
import { summarizeDailyMacros } from './summarizeDailyMacros';
import { localToday } from './today';
import { useDailyFoodLogs } from './useDailyFoodLogs';

interface DailyDashboardProps {
  readonly userId: string;
}

/**
 * Cozy daily macro dashboard. Reads the user's active goal and today's logs
 * with TanStack Query (no `useEffect` for fetching) and feeds both into the
 * pure {@link summarizeDailyMacros} to show remaining calories prominently
 * plus a per-macro progress bar for protein/fat/carbs.
 *
 * States are handled in order: loading, error (friendly copy, never the raw
 * error), no active goal (friendly CTA, never NaN), and finally the summary.
 * Over-budget is surfaced by {@link MacroProgressBar}: the bar stays clamped at
 * 100% while the real (possibly negative) remaining number shows in the pink
 * warning accent.
 */
export function DailyDashboard({ userId }: DailyDashboardProps): JSX.Element {
  const date = localToday();
  const goalQuery = useMacroGoal(userId);
  const logsQuery = useDailyFoodLogs(userId, date);

  if (goalQuery.isLoading || logsQuery.isLoading) {
    return (
      <FormCard>
        <DashboardHeading />
        <p className="text-center text-sm text-muted">
          {COPY.dashboard.loading}
        </p>
      </FormCard>
    );
  }

  if (goalQuery.isError || logsQuery.isError) {
    return (
      <FormCard>
        <DashboardHeading />
        <p role="alert" className="text-center text-sm text-sage">
          {COPY.dashboard.error}
        </p>
      </FormCard>
    );
  }

  const goal = goalQuery.data ?? null;

  if (goal === null) {
    return (
      <FormCard>
        <DashboardHeading />
        <p className="text-center text-sm text-muted">
          {COPY.dashboard.noGoal}
        </p>
      </FormCard>
    );
  }

  const logs = logsQuery.data ?? [];
  const summary = summarizeDailyMacros(logs, goal);
  const remainingCalories = Math.round(summary.remaining.calories);
  const caloriesOver = summary.remaining.calories < 0;

  return (
    <FormCard>
      <DashboardHeading />

      <div className="mb-6 text-center">
        <p className="text-sm text-muted">{COPY.dashboard.remainingCalories}</p>
        <p
          className={`font-serif text-4xl font-semibold ${
            caloriesOver ? 'text-pink' : 'text-ink'
          }`}
        >
          {remainingCalories}
        </p>
        {caloriesOver ? (
          <p className="mt-1 text-sm text-pink">{COPY.dashboard.overBudget}</p>
        ) : null}
      </div>

      {logs.length === 0 ? (
        <p className="mb-4 text-center text-sm text-muted">
          {COPY.dashboard.empty}
        </p>
      ) : null}

      <div className="flex flex-col gap-4">
        <MacroProgressBar
          label={COPY.dashboard.protein}
          consumed={summary.consumed.protein}
          remaining={summary.remaining.protein}
          percent={summary.percent.protein}
          unit="g"
        />
        <MacroProgressBar
          label={COPY.dashboard.fat}
          consumed={summary.consumed.fat}
          remaining={summary.remaining.fat}
          percent={summary.percent.fat}
          unit="g"
        />
        <MacroProgressBar
          label={COPY.dashboard.carbs}
          consumed={summary.consumed.carbs}
          remaining={summary.remaining.carbs}
          percent={summary.percent.carbs}
          unit="g"
        />
      </div>
    </FormCard>
  );
}

/** Shared serif heading reused across every dashboard state. */
function DashboardHeading(): JSX.Element {
  return (
    <header className="mb-6 text-center">
      <h2 className="font-serif text-2xl font-semibold text-ink">
        {COPY.dashboard.title}
      </h2>
    </header>
  );
}

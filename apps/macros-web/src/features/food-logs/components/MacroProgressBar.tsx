interface MacroProgressBarProps {
  /** Human label for the macro (e.g. "Proteína"). */
  readonly label: string;
  /** Grams (or kcal) consumed so far today. */
  readonly consumed: number;
  /** target - consumed. MAY be negative when over budget. */
  readonly remaining: number;
  /** Fill percent, already clamped to [0, 100] by summarizeDailyMacros. */
  readonly percent: number;
  /** Unit suffix shown next to the numbers (e.g. "g"). */
  readonly unit: string;
}

/**
 * Tiny presentational progress bar for a single macro. The track uses the
 * sage token at low opacity and the fill uses solid sage at `percent` width;
 * because `percent` is pre-clamped the bar never exceeds 100% even when the
 * user is over budget. When `remaining` is negative we surface it in the pink
 * warning accent so going over is visible rather than hidden.
 *
 * Pure and token-only: every color/radius/typography comes from a Tailwind
 * theme name (no raw hex).
 */
export function MacroProgressBar({
  label,
  consumed,
  remaining,
  percent,
  unit,
}: MacroProgressBarProps): JSX.Element {
  const isOver = remaining < 0;
  const roundedRemaining = Math.round(remaining);
  const roundedConsumed = Math.round(consumed);
  const width = `${percent}%`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <span
          className={`text-sm font-medium ${isOver ? 'text-pink' : 'text-muted'}`}
        >
          {roundedRemaining}
          {unit}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-card bg-sage/20"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className="h-full rounded-card bg-sage" style={{ width }} />
      </div>
      <span className="text-xs text-muted">
        {roundedConsumed}
        {unit}
      </span>
    </div>
  );
}

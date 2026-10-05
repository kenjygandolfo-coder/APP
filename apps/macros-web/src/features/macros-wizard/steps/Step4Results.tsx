import type { MacroResult } from '../../../domain';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { COPY } from '../copy.es';

interface Step4ResultsProps {
  readonly result: MacroResult;
  readonly saved: boolean;
  readonly onSave: () => void;
  readonly onEdit: () => void;
}

interface MacroRow {
  readonly label: string;
  readonly grams: number;
  readonly kcal: number;
  readonly percent: number;
}

function MacroItem({ label, grams, kcal, percent }: MacroRow): JSX.Element {
  return (
    <li className="flex items-baseline justify-between border-b border-cardBorder py-2">
      <span className="text-ink">{label}</span>
      <span className="text-muted">
        <span className="font-medium text-ink">
          {grams} {COPY.results.gramsUnit}
        </span>{' '}
        · {kcal} {COPY.results.kcalUnit} · {percent}%
      </span>
    </li>
  );
}

/** Step 4: Playfair-serif summary of the computed macros plus save/edit actions. */
export function Step4Results({
  result,
  saved,
  onSave,
  onEdit,
}: Step4ResultsProps): JSX.Element {
  const macros: readonly MacroRow[] = [
    { label: COPY.results.protein, ...result.protein },
    { label: COPY.results.fat, ...result.fat },
    { label: COPY.results.carbs, ...result.carbs },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <p className="text-sm uppercase tracking-wide text-muted">
          {COPY.results.calorieTarget}
        </p>
        <p className="font-serif text-4xl font-semibold text-ink">
          {result.calorieTarget} {COPY.results.kcalUnit}
        </p>
      </div>

      <ul className="flex flex-col">
        {macros.map((macro) => (
          <MacroItem key={macro.label} {...macro} />
        ))}
      </ul>

      {saved ? (
        <p
          role="status"
          className="rounded-md border border-sage bg-sage/15 px-4 py-2 text-center text-ink"
        >
          {COPY.saveSuccess}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <SecondaryButton onClick={onEdit}>{COPY.actions.edit}</SecondaryButton>
        <PrimaryButton onClick={onSave}>{COPY.actions.save}</PrimaryButton>
      </div>
    </div>
  );
}

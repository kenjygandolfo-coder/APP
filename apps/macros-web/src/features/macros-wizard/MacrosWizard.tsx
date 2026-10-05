import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import type { DefaultValues } from 'react-hook-form';
import { FormProvider, useForm } from 'react-hook-form';

import { calculateMacros, type MacroResult } from '../../domain';
import { PrimaryButton, SecondaryButton } from './components/Button';
import { FormCard } from './components/FormCard';
import { COPY } from './copy.es';
import { Step1GenderAge } from './steps/Step1GenderAge';
import { Step2WeightHeight } from './steps/Step2WeightHeight';
import { Step3Activity } from './steps/Step3Activity';
import { Step4Results } from './steps/Step4Results';
import {
  defaultValues,
  STEP_FIELDS,
  type WizardValues,
  wizardSchema,
} from './wizard.schema';

const TOTAL_STEPS = 4;
const RESULTS_STEP = 3;

const STEP_HEADINGS = [
  COPY.steps.genderAge,
  COPY.steps.weightHeight,
  COPY.steps.activity,
  COPY.steps.results,
] as const;

interface MacrosWizardProps {
  /**
   * Called with the computed result when the user saves. The root wires this
   * to the macro-goal persistence mutation (feeding the authenticated userId);
   * when omitted (e.g. signed-out) the wizard still shows the local success
   * confirmation without persisting.
   */
  readonly onSave?: (result: MacroResult) => void;
}

/**
 * Four-step macros wizard. A single react-hook-form instance spans all steps,
 * so "Corregir datos" returns to step 1 without clearing entered values.
 */
export function MacrosWizard({ onSave }: MacrosWizardProps = {}): JSX.Element {
  const methods = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onTouched',
    defaultValues: defaultValues as unknown as DefaultValues<WizardValues>,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [saved, setSaved] = useState(false);

  const result = useMemo<MacroResult | null>(() => {
    if (currentStep !== RESULTS_STEP) {
      return null;
    }
    try {
      // getValues() returns raw strings from the DOM inputs; the wizard schema
      // coerces them to the numeric TdeeInput that calculateMacros expects.
      const parsed = wizardSchema.parse(methods.getValues());
      return calculateMacros(parsed);
    } catch {
      // Defense-in-depth only: per-step validation gating (handleNext +
      // STEP_FIELDS) already validates every field before the results step is
      // reachable, so this branch is not normally hit. It is kept intentionally
      // so a future gating regression surfaces as a visible error, not a crash.
      return null;
    }
  }, [currentStep, methods]);

  const handleNext = async (): Promise<void> => {
    const fields = STEP_FIELDS[currentStep];
    const ok = fields ? await methods.trigger(fields) : true;
    if (ok) {
      setCurrentStep((step) => Math.min(step + 1, TOTAL_STEPS - 1));
    }
  };

  const handleBack = (): void => {
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const handleEdit = (): void => {
    setSaved(false);
    setCurrentStep(0);
  };

  const handleSave = (saveResult: MacroResult): void => {
    // Persist against the authenticated user when the root provided a sink;
    // the local confirmation shows regardless so the UX is unchanged offline.
    onSave?.(saveResult);
    setSaved(true);
  };

  const heading = STEP_HEADINGS[currentStep] ?? STEP_HEADINGS[0];

  return (
    <FormProvider {...methods}>
      <FormCard>
        <header className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted">
            {COPY.nav.stepIndicator(currentStep + 1, TOTAL_STEPS)}
          </p>
          <h2 className="mt-1 font-serif text-2xl font-semibold text-ink">
            {heading.title}
          </h2>
          <p className="mt-1 text-sm text-muted">{heading.subtitle}</p>
        </header>

        {currentStep === 0 ? <Step1GenderAge /> : null}
        {currentStep === 1 ? <Step2WeightHeight /> : null}
        {currentStep === 2 ? <Step3Activity /> : null}
        {currentStep === RESULTS_STEP && result ? (
          <Step4Results
            result={result}
            saved={saved}
            onSave={() => handleSave(result)}
            onEdit={handleEdit}
          />
        ) : null}
        {currentStep === RESULTS_STEP && !result ? (
          <p role="alert" className="text-center text-sm text-sage">
            {COPY.calculationError}
          </p>
        ) : null}

        {currentStep < RESULTS_STEP ? (
          <div className="mt-6 flex items-center justify-between gap-3">
            <SecondaryButton onClick={handleBack} disabled={currentStep === 0}>
              {COPY.nav.back}
            </SecondaryButton>
            <PrimaryButton onClick={handleNext}>{COPY.nav.next}</PrimaryButton>
          </div>
        ) : null}
      </FormCard>
    </FormProvider>
  );
}

import { useFormContext } from 'react-hook-form';

import { TextField } from '../components/TextField';
import { COPY } from '../copy.es';
import type { WizardValues } from '../wizard.schema';

/** Step 2: weight + height number inputs. */
export function Step2WeightHeight(): JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();

  return (
    <div className="flex flex-col gap-4">
      <TextField
        id="weightKg"
        label={COPY.fields.weightKg}
        register={register('weightKg')}
        inputMode="decimal"
        error={errors.weightKg?.message}
      />
      <TextField
        id="heightCm"
        label={COPY.fields.heightCm}
        register={register('heightCm')}
        inputMode="decimal"
        error={errors.heightCm?.message}
      />
    </div>
  );
}

import { useFormContext } from 'react-hook-form';

import { ACTIVITY_LEVELS } from '../../../domain';
import { SelectField } from '../components/SelectField';
import { COPY } from '../copy.es';
import type { WizardValues } from '../wizard.schema';

/** Step 3: physical activity level (select). */
export function Step3Activity(): JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();

  const activityOptions = ACTIVITY_LEVELS.map((value) => ({
    value,
    label: COPY.activityOptions[value],
  }));

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        id="activityLevel"
        label={COPY.fields.activityLevel}
        register={register('activityLevel')}
        options={activityOptions}
        placeholder={COPY.placeholders.select}
        error={errors.activityLevel?.message}
      />
    </div>
  );
}

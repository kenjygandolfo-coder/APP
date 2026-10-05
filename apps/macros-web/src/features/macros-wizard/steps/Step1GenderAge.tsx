import { useFormContext } from 'react-hook-form';

import { SEXES } from '../../../domain';
import { SelectField } from '../components/SelectField';
import { TextField } from '../components/TextField';
import { COPY } from '../copy.es';
import type { WizardValues } from '../wizard.schema';

/** Step 1: gender (select) + age (number input). */
export function Step1GenderAge(): JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardValues>();

  const genderOptions = SEXES.map((value) => ({
    value,
    label: COPY.genderOptions[value],
  }));

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        id="sex"
        label={COPY.fields.sex}
        register={register('sex')}
        options={genderOptions}
        placeholder={COPY.placeholders.select}
        error={errors.sex?.message}
      />
      <TextField
        id="ageYears"
        label={COPY.fields.ageYears}
        register={register('ageYears')}
        error={errors.ageYears?.message}
      />
    </div>
  );
}

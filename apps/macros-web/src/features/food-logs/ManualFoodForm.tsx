import { zodResolver } from '@hookform/resolvers/zod';
import type { DefaultValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { PrimaryButton } from '../macros-wizard/components/Button';
import { FormCard } from '../macros-wizard/components/FormCard';
import { TextField } from '../macros-wizard/components/TextField';
import { COPY } from './copy.es';
import {
  foodLogDefaults,
  foodLogSchema,
  type FoodFormValues,
} from './schemas/foodLog.schema';
import type { AddFoodLogInput } from './types';
import { useAddFoodLog } from './useAddFoodLog';

interface ManualFoodFormProps {
  readonly userId: string;
}

/**
 * Manual food entry surface. Reuses the shared FormCard/TextField/PrimaryButton
 * primitives, validates with zod via zodResolver, and persists through the
 * FEAT-001 `useAddFoodLog` mutation. On a successful save the inputs are
 * cleared (reset) so the next item can be logged immediately.
 *
 * Manual entry only: no AI search or external product database. quantity/unit
 * defaults are applied by the data layer, so the form never asks for them.
 */
export function ManualFoodForm({ userId }: ManualFoodFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FoodFormValues>({
    resolver: zodResolver(foodLogSchema),
    mode: 'onTouched',
    // Inputs arrive as empty strings; the resolver coerces them to the numeric
    // FoodFormValues. Cast mirrors the macros-wizard pattern for string-backed
    // controlled inputs over a numeric schema.
    defaultValues: foodLogDefaults as unknown as DefaultValues<FoodFormValues>,
  });

  const mutation = useAddFoodLog(userId);

  const onValid = (values: FoodFormValues): void => {
    const input: AddFoodLogInput = {
      user_id: userId,
      name: values.name,
      calories: values.calories,
      protein_g: values.protein_g,
      fat_g: values.fat_g,
      carbs_g: values.carbs_g,
    };
    mutation.mutate(input, {
      onSuccess: () =>
        reset(foodLogDefaults as unknown as DefaultValues<FoodFormValues>),
    });
  };

  return (
    <FormCard>
      <header className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink">
          {COPY.form.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{COPY.form.subtitle}</p>
      </header>
      <form
        noValidate
        onSubmit={handleSubmit(onValid)}
        className="flex flex-col gap-4"
      >
        <TextField
          id="food-name"
          label={COPY.form.fields.name}
          type="text"
          inputMode="text"
          register={register('name')}
          error={errors.name?.message}
        />
        <TextField
          id="food-calories"
          label={COPY.form.fields.calories}
          type="number"
          inputMode="numeric"
          register={register('calories')}
          error={errors.calories?.message}
        />
        <TextField
          id="food-protein"
          label={COPY.form.fields.protein}
          type="number"
          inputMode="decimal"
          register={register('protein_g')}
          error={errors.protein_g?.message}
        />
        <TextField
          id="food-fat"
          label={COPY.form.fields.fat}
          type="number"
          inputMode="decimal"
          register={register('fat_g')}
          error={errors.fat_g?.message}
        />
        <TextField
          id="food-carbs"
          label={COPY.form.fields.carbs}
          type="number"
          inputMode="decimal"
          register={register('carbs_g')}
          error={errors.carbs_g?.message}
        />
        {mutation.isError ? (
          <p role="alert" className="text-sm text-sage">
            {COPY.form.error}
          </p>
        ) : null}
        {mutation.isSuccess ? (
          <p role="status" className="text-sm text-sage">
            {COPY.form.success}
          </p>
        ) : null}
        <PrimaryButton type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? COPY.form.submitting : COPY.form.submit}
        </PrimaryButton>
      </form>
    </FormCard>
  );
}

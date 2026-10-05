import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthField } from './components/AuthField';
import { FormCard } from '../macros-wizard/components/FormCard';
import { PrimaryButton } from '../macros-wizard/components/Button';
import { COPY } from './copy.es';
import {
  registerDefaults,
  registerSchema,
  type RegisterValues,
} from './schemas/auth.schema';
import type { AuthLogger, AuthSubmitHandler } from './types';
import { makeRegisterSubmit, type RegisterResult } from './useAuthActions';
import { useAuthSubmit } from './useAuthSubmit';

interface RegisterFormProps {
  readonly onSubmit?: AuthSubmitHandler<RegisterValues, RegisterResult>;
  readonly onSuccess?: () => void;
  readonly logger?: AuthLogger;
}

/**
 * Registro screen. Mirrors LoginForm with a third confirmPassword field; the
 * cross-field mismatch error ('Las contraseñas no coinciden.') is mapped by the
 * schema refine onto confirmPassword and rendered there by react-hook-form. By
 * default the submit flow calls the real Supabase sign-up (useAuthActions,
 * which drops confirmPassword); `onSubmit` stays injectable for tests.
 */
export function RegisterForm({
  onSubmit,
  onSuccess,
  logger,
}: RegisterFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: registerDefaults,
  });

  // Default to the real Supabase sign-up; tests inject a mock `onSubmit`.
  const submit = useMemo(() => onSubmit ?? makeRegisterSubmit(), [onSubmit]);

  // When sign-up returns no session (email confirmation required) the success
  // screen shows a "revisa tu correo" message instead of implying an active
  // session; a materialized session flips the SessionProvider via onAuthStateChange.
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const { submitted, submitError, handleSubmit: onValid } =
    useAuthSubmit<RegisterValues, RegisterResult>({
      label: 'register',
      errorMessage:
        'No se pudo crear la cuenta. Verifica tus datos e inténtalo de nuevo.',
      onSubmit: submit,
      logger,
      onResult: (result) =>
        setPendingConfirmation(result?.pendingConfirmation ?? false),
      onSuccess,
    });

  if (submitted) {
    return (
      <FormCard>
        <p role="status" className="text-center font-serif text-xl text-ink">
          {pendingConfirmation
            ? COPY.register.confirmEmail
            : COPY.register.success}
        </p>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <header className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink">
          {COPY.register.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{COPY.register.subtitle}</p>
      </header>
      <form
        noValidate
        onSubmit={handleSubmit(onValid)}
        className="flex flex-col gap-4"
      >
        <AuthField
          id="register-email"
          label={COPY.fields.email}
          type="email"
          autoComplete="email"
          placeholder={COPY.placeholders.email}
          register={register('email')}
          error={errors.email?.message}
        />
        <AuthField
          id="register-password"
          label={COPY.fields.password}
          type="password"
          autoComplete="new-password"
          placeholder={COPY.placeholders.password}
          register={register('password')}
          error={errors.password?.message}
        />
        <AuthField
          id="register-confirm-password"
          label={COPY.fields.confirmPassword}
          type="password"
          autoComplete="new-password"
          placeholder={COPY.placeholders.confirmPassword}
          register={register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        {submitError ? (
          <p role="alert" className="text-sm text-sage">
            {submitError}
          </p>
        ) : null}
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {COPY.register.submit}
        </PrimaryButton>
      </form>
    </FormCard>
  );
}

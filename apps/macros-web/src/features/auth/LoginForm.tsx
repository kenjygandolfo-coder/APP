import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { AuthField } from './components/AuthField';
import { FormCard } from '../macros-wizard/components/FormCard';
import { PrimaryButton } from '../macros-wizard/components/Button';
import { COPY } from './copy.es';
import {
  loginDefaults,
  loginSchema,
  type LoginValues,
} from './schemas/auth.schema';
import type { AuthLogger, AuthSubmitHandler } from './types';
import { makeLoginSubmit } from './useAuthActions';
import { useAuthSubmit } from './useAuthSubmit';

interface LoginFormProps {
  readonly onSubmit?: AuthSubmitHandler<LoginValues>;
  readonly onSuccess?: () => void;
  readonly logger?: AuthLogger;
}

/**
 * Login screen. react-hook-form + zodResolver drive validation; by default the
 * submit flow calls the real Supabase sign-in (useAuthActions), while `onSubmit`
 * stays injectable for tests. Only redacted credentials are ever logged, and
 * the friendly Spanish error below never leaks provider text.
 */
export function LoginForm({
  onSubmit,
  onSuccess,
  logger,
}: LoginFormProps): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: loginDefaults,
  });

  // Default to the real Supabase sign-in; tests inject a mock `onSubmit`.
  const submit = useMemo(() => onSubmit ?? makeLoginSubmit(), [onSubmit]);

  const { submitted, submitError, handleSubmit: onValid } =
    useAuthSubmit<LoginValues>({
      label: 'login',
      errorMessage: 'No se pudo iniciar sesión. Revisa tu correo y contraseña.',
      onSubmit: submit,
      logger,
      onSuccess,
    });

  if (submitted) {
    return (
      <FormCard>
        <p role="status" className="text-center font-serif text-xl text-ink">
          {COPY.login.success}
        </p>
      </FormCard>
    );
  }

  return (
    <FormCard>
      <header className="mb-6 text-center">
        <h2 className="font-serif text-2xl font-semibold text-ink">
          {COPY.login.title}
        </h2>
        <p className="mt-1 text-sm text-muted">{COPY.login.subtitle}</p>
      </header>
      <form
        noValidate
        onSubmit={handleSubmit(onValid)}
        className="flex flex-col gap-4"
      >
        <AuthField
          id="login-email"
          label={COPY.fields.email}
          type="email"
          autoComplete="email"
          placeholder={COPY.placeholders.email}
          register={register('email')}
          error={errors.email?.message}
        />
        <AuthField
          id="login-password"
          label={COPY.fields.password}
          type="password"
          autoComplete="current-password"
          placeholder={COPY.placeholders.password}
          register={register('password')}
          error={errors.password?.message}
        />
        {submitError ? (
          <p role="alert" className="text-sm text-sage">
            {submitError}
          </p>
        ) : null}
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {COPY.login.submit}
        </PrimaryButton>
      </form>
    </FormCard>
  );
}

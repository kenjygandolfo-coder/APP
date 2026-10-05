import type { UseFormRegisterReturn } from 'react-hook-form';

interface AuthFieldProps {
  readonly id: string;
  readonly label: string;
  readonly type: 'email' | 'password';
  readonly register: UseFormRegisterReturn;
  readonly error?: string;
  readonly autoComplete?: string;
  readonly placeholder?: string;
}

/**
 * Labelled email/password input wired for react-hook-form. Mirrors the macros
 * TextField styling (sage focus border, translucent input) so the Auth screens
 * share the Enchanted/Cozy look. Error text renders in the sage accent.
 */
export function AuthField({
  id,
  label,
  type,
  register,
  error,
  autoComplete,
  placeholder,
}: AuthFieldProps): JSX.Element {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md border border-cardBorder bg-white/70 px-3 py-2 text-ink transition-colors duration-150 focus:border-sage focus:outline-none focus:ring focus:ring-sage/30"
        {...register}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-sage">
          {error}
        </p>
      ) : null}
    </div>
  );
}

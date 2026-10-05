import type { UseFormRegisterReturn } from 'react-hook-form';

interface TextFieldProps {
  readonly id: string;
  readonly label: string;
  readonly register: UseFormRegisterReturn;
  readonly error?: string;
  readonly type?: 'text' | 'number';
  readonly inputMode?: 'text' | 'numeric' | 'decimal';
}

/**
 * Labelled input wired for react-hook-form. The border lights up sage on
 * focus; error text renders in the sage accent (text-sage) for readability.
 */
export function TextField({
  id,
  label,
  register,
  error,
  type = 'number',
  inputMode = 'numeric',
}: TextFieldProps): JSX.Element {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
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

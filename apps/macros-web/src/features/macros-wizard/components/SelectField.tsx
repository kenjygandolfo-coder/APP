import type { UseFormRegisterReturn } from 'react-hook-form';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

interface SelectFieldProps {
  readonly id: string;
  readonly label: string;
  readonly register: UseFormRegisterReturn;
  readonly options: readonly SelectOption[];
  readonly placeholder: string;
  readonly error?: string;
}

/**
 * Labelled native <select> wired for react-hook-form. Same sage focus accent
 * and error display as {@link TextField}.
 */
export function SelectField({
  id,
  label,
  register,
  options,
  placeholder,
  error,
}: SelectFieldProps): JSX.Element {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md border border-cardBorder bg-white/70 px-3 py-2 text-ink transition-colors duration-150 focus:border-sage focus:outline-none focus:ring focus:ring-sage/30"
        defaultValue=""
        {...register}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-sage">
          {error}
        </p>
      ) : null}
    </div>
  );
}

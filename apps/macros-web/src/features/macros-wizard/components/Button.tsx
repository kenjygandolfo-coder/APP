import type { ReactNode } from 'react';

interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly type?: 'button' | 'submit';
  readonly disabled?: boolean;
}

const BASE =
  'rounded-md px-5 py-2 font-medium transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0';

/** Primary call-to-action: sage fill, white text, hover lift. */
export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BASE} bg-sage text-white shadow-sm`}
    >
      {children}
    </button>
  );
}

/** Secondary action: pink-tinted outline, hover lift. */
export function SecondaryButton({
  children,
  onClick,
  type = 'button',
  disabled = false,
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BASE} border border-pink bg-pink/20 text-ink`}
    >
      {children}
    </button>
  );
}

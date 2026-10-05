import type { ReactNode } from 'react';

interface FormCardProps {
  readonly children: ReactNode;
}

/**
 * Translucent "cozy" card container: soft white glass with backdrop blur,
 * 16px radius and a subtle border. All styling flows from Tailwind tokens.
 */
export function FormCard({ children }: FormCardProps): JSX.Element {
  return (
    <section className="w-full max-w-md rounded-card border border-cardBorder bg-card p-8 shadow-sm backdrop-blur">
      {children}
    </section>
  );
}

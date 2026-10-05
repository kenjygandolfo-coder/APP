import { COPY } from './features/macros-wizard/copy.es';
import { MacrosWizard } from './features/macros-wizard/MacrosWizard';

/**
 * Root of the Macros wizard web module. Renders the app title/subtitle above
 * the wizard card, both centered on the cozy cream background.
 */
export default function App(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream p-4">
      <header className="text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
          {COPY.app.title}
        </h1>
        <p className="mt-2 text-sm text-muted sm:text-base">
          {COPY.app.subtitle}
        </p>
      </header>
      <MacrosWizard />
    </main>
  );
}

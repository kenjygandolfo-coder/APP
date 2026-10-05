import { useCallback, useState } from 'react';

import type { AuthLogger, AuthSubmitHandler, Credentials } from './types';
import { noopAuthLogger, redactCredentials } from './types';

interface UseAuthSubmitArgs<T extends Credentials> {
  readonly label: string;
  readonly errorMessage: string;
  readonly onSubmit?: AuthSubmitHandler<T>;
  readonly logger?: AuthLogger;
  readonly onSuccess?: () => void;
}

interface UseAuthSubmitResult<T> {
  readonly submitted: boolean;
  readonly submitError: string | null;
  readonly handleSubmit: (values: T) => Promise<void>;
}

/**
 * Shared submit behaviour for the Login and Registro forms. The default path
 * ONLY emits the redacted credentials to the injectable logger; the real
 * backend call lives in the injected `onSubmit` (wired to Supabase Auth via
 * useAuthActions). The raw password never leaves this flow.
 *
 * SESSION PERSISTENCE: supabase-js owns session persistence (localStorage on
 * web via its own auth storage), so this hook deliberately writes NO token.
 */
export function useAuthSubmit<T extends Credentials>({
  label,
  errorMessage,
  onSubmit,
  logger = noopAuthLogger,
  onSuccess,
}: UseAuthSubmitArgs<T>): UseAuthSubmitResult<T> {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultSubmit = useCallback(
    async (values: T): Promise<void> => {
      // Redacted logging only (never the raw password). The real backend call
      // is supplied through `onSubmit`.
      logger(label, redactCredentials(values));
    },
    [label, logger],
  );

  const handleSubmit = useCallback(
    async (values: T): Promise<void> => {
      setSubmitError(null);
      try {
        await (onSubmit ?? defaultSubmit)(values);
        setSubmitted(true);
        onSuccess?.();
      } catch {
        // Surface a friendly, non-leaky message; the underlying provider error
        // detail is intentionally not shown to avoid leaking auth internals.
        setSubmitError(errorMessage);
      }
    },
    [defaultSubmit, errorMessage, onSubmit, onSuccess],
  );

  return { submitted, submitError, handleSubmit };
}

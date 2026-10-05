import { useCallback, useState } from 'react';

import type { AuthLogger, AuthSubmitHandler, Credentials } from './types';
import { noopAuthLogger, redactCredentials } from './types';

interface UseAuthSubmitArgs<T extends Credentials, R = void> {
  readonly label: string;
  readonly errorMessage: string;
  readonly onSubmit?: AuthSubmitHandler<T, R>;
  readonly logger?: AuthLogger;
  readonly onSuccess?: () => void;
  /**
   * Invoked with the handler's resolved result on a successful (non-throwing)
   * submit, BEFORE `onSuccess`. Lets a form branch on the outcome (e.g. a
   * sign-up that resolved no session because email confirmation is pending).
   */
  readonly onResult?: (result: R) => void;
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
export function useAuthSubmit<T extends Credentials, R = void>({
  label,
  errorMessage,
  onSubmit,
  logger = noopAuthLogger,
  onSuccess,
  onResult,
}: UseAuthSubmitArgs<T, R>): UseAuthSubmitResult<T> {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultSubmit = useCallback(
    async (values: T): Promise<R> => {
      // Redacted logging only (never the raw password). The real backend call
      // is supplied through `onSubmit`.
      logger(label, redactCredentials(values));
      return undefined as R;
    },
    [label, logger],
  );

  const handleSubmit = useCallback(
    async (values: T): Promise<void> => {
      setSubmitError(null);
      try {
        const result = await (onSubmit ?? defaultSubmit)(values);
        // Let the form branch on the result (e.g. pending confirmation) before
        // flipping to the shared submitted state.
        onResult?.(result);
        setSubmitted(true);
        onSuccess?.();
      } catch {
        // Surface a friendly, non-leaky message; the underlying provider error
        // detail is intentionally not shown to avoid leaking auth internals.
        setSubmitError(errorMessage);
      }
    },
    [defaultSubmit, errorMessage, onResult, onSubmit, onSuccess],
  );

  return { submitted, submitError, handleSubmit };
}

import { useCallback, useState } from 'react';

import { useAuthStorage } from './storage';
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
 * Shared submit behaviour for the Login and Registro forms. Logs ONLY the
 * redacted credentials, persists a dev placeholder session token through the
 * platform storage (FEAT-001), then flags success. The raw password never
 * leaves this flow. Swap `onSubmit` for the real API/Supabase call later.
 */
export function useAuthSubmit<T extends Credentials>({
  label,
  errorMessage,
  onSubmit,
  logger = noopAuthLogger,
  onSuccess,
}: UseAuthSubmitArgs<T>): UseAuthSubmitResult<T> {
  const storage = useAuthStorage();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultSubmit = useCallback(
    async (values: T): Promise<void> => {
      logger(label, redactCredentials(values));
      // Dev placeholder only: NOT a secret. Replaced by the real JWT once the
      // API/Supabase call is wired into `onSubmit`.
      await storage.saveToken(`session-${Date.now()}`);
    },
    [label, logger, storage],
  );

  const handleSubmit = useCallback(
    async (values: T): Promise<void> => {
      setSubmitError(null);
      try {
        await (onSubmit ?? defaultSubmit)(values);
        setSubmitted(true);
        onSuccess?.();
      } catch {
        // Surface a friendly, non-leaky message; the underlying error detail is
        // intentionally not shown to avoid exposing storage internals.
        setSubmitError(errorMessage);
      }
    },
    [defaultSubmit, errorMessage, onSubmit, onSuccess],
  );

  return { submitted, submitError, handleSubmit };
}

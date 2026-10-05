/**
 * Shared contracts for the Auth forms (Login + Registro). These types keep the
 * submit flow DECOUPLED from any backend: the forms accept an injectable
 * onSubmit handler and an injectable logger sink, so the real API/Supabase call
 * can be plugged in later without touching the UI.
 *
 * SECURITY: the raw password is NEVER logged. The default logger forwards only
 * a redacted shape ({ email, passwordLength }) to an injectable sink. The
 * default sink is a no-op, so ESLint `no-console` (error) stays green with zero
 * disables in committed code.
 */

/** Minimal shape the auth forms produce; both LoginValues and RegisterValues satisfy it. */
export interface Credentials {
  readonly email: string;
  readonly password: string;
}

/**
 * Redacted projection safe to log/telemetry. Contains the email and the
 * password LENGTH only, never the password itself.
 */
export interface RedactedCredentials {
  readonly email: string;
  readonly passwordLength: number;
}

/**
 * Injectable submit handler. Ready to be swapped for the real API/Supabase
 * call. Receives the already-validated form values.
 */
export type AuthSubmitHandler<T> = (values: T) => void | Promise<void>;

/**
 * Injectable logging sink. Receives a human label and the REDACTED credentials.
 * The default sink is a no-op; a test may pass a spy, and production may pass a
 * telemetry adapter. It intentionally cannot receive the raw password.
 */
export type AuthLogger = (label: string, redacted: RedactedCredentials) => void;

/**
 * Pure helper that strips the password down to its length. Returning a new
 * object keeps the input immutable and guarantees the raw password cannot leak
 * through the logger.
 */
export function redactCredentials(values: Credentials): RedactedCredentials {
  return { email: values.email, passwordLength: values.password.length };
}

/** No-op default sink: keeps `no-console` green while leaving a seam for telemetry. */
export const noopAuthLogger: AuthLogger = () => {
  // Intentionally does nothing. Inject a real sink to observe redacted auth events.
};

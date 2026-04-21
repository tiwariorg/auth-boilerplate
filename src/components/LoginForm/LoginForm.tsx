/**
 * LoginForm.tsx
 *
 * A controlled login form component with field-level and server-level error
 * display, loading state management, and client-side validation via
 * `validateLoginForm` from utils/validation.
 */

import { type FormEvent, useState } from 'react';
import { validateLoginForm } from '../../utils/validation';
import type { LoginFormErrors } from '../../utils/validation';
import styles from './LoginForm.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LoginFormProps {
  /** Called with validated email and password when the form is submitted. */
  onSubmit: (email: string, password: string) => Promise<void>;
  /** A server-level or external error message to display beneath the fields. */
  error?: string | null;
  /** When true, the submit button is disabled and shows a loading label. */
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * LoginForm
 *
 * Renders an accessible email/password login form. Validates fields on
 * submission and surfaces both field-level and form-level errors to the user.
 */
export function LoginForm({ onSubmit, error, isLoading = false }: LoginFormProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<LoginFormErrors>({});

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    // Clear the email field error as soon as the user starts correcting it.
    if (fieldErrors.email) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
    }
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    // Clear the password field error as soon as the user starts correcting it.
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validateLoginForm(email, password);

    if (validationErrors !== null) {
      setFieldErrors(validationErrors);
      return;
    }

    // Form is valid — clear any lingering field errors and delegate upward.
    setFieldErrors({});
    await onSubmit(email, password);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      noValidate
      data-testid="login-form"
    >
      {/* Email field */}
      <div className={styles.fieldGroup}>
        <label htmlFor="login-email" className={styles.label}>
          Email
        </label>
        <input
          id="login-email"
          type="email"
          className={`${styles.input}${fieldErrors.email ? ` ${styles.inputError}` : ''}`}
          value={email}
          onChange={handleEmailChange}
          aria-label="Email"
          aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          aria-invalid={fieldErrors.email ? true : undefined}
          autoComplete="email"
          data-testid="email-input"
        />
        {fieldErrors.email && (
          <span
            id="login-email-error"
            className={styles.fieldError}
            role="alert"
            data-testid="email-error"
          >
            {fieldErrors.email}
          </span>
        )}
      </div>

      {/* Password field */}
      <div className={styles.fieldGroup}>
        <label htmlFor="login-password" className={styles.label}>
          Password
        </label>
        <input
          id="login-password"
          type="password"
          className={`${styles.input}${fieldErrors.password ? ` ${styles.inputError}` : ''}`}
          value={password}
          onChange={handlePasswordChange}
          aria-label="Password"
          aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
          aria-invalid={fieldErrors.password ? true : undefined}
          autoComplete="current-password"
          data-testid="password-input"
        />
        {fieldErrors.password && (
          <span
            id="login-password-error"
            className={styles.fieldError}
            role="alert"
            data-testid="password-error"
          >
            {fieldErrors.password}
          </span>
        )}
      </div>

      {/* Server / external error */}
      {error && (
        <div
          className={styles.serverError}
          role="alert"
          data-testid="server-error"
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className={styles.submitButton}
        disabled={isLoading}
        aria-disabled={isLoading}
        data-testid="submit-button"
      >
        {isLoading ? 'Logging in...' : 'Log In'}
      </button>
    </form>
  );
}

export default LoginForm;

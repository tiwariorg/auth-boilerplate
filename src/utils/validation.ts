/**
 * validation.ts
 *
 * Utility functions for validating user-supplied form input.
 *
 * Each validator follows a consistent contract:
 *   - Returns `null` when the value is considered valid.
 *   - Returns a human-readable error string when the value is invalid.
 *
 * `validateLoginForm` composes the individual validators and returns either
 * a map of field-level errors or `null` when the entire form is valid.
 */

/** Basic email pattern — requires at least one non-whitespace/@ character on
 *  each side of the `@` sign and a dot in the domain portion. */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a single email address string.
 *
 * @param email - The raw email string supplied by the user.
 * @returns `null` if the email is valid, otherwise a descriptive error string.
 *
 * @example
 * validateEmail('');                 // 'Email is required'
 * validateEmail('not-an-email');     // 'Invalid email format'
 * validateEmail('user@example.com'); // null
 */
export function validateEmail(email: string): string | null {
  if (email.trim() === '') {
    return 'Email is required';
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email format';
  }

  return null;
}

/**
 * Validates a single password string.
 *
 * @param password - The raw password string supplied by the user.
 * @returns `null` if the password is valid, otherwise a descriptive error string.
 *
 * @example
 * validatePassword('');          // 'Password is required'
 * validatePassword('secret123'); // null
 */
export function validatePassword(password: string): string | null {
  if (password === '') {
    return 'Password is required';
  }

  return null;
}

/**
 * Represents the set of field-level validation errors for the login form.
 * A field key is present only when that field failed validation.
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Validates all fields of the login form in a single pass.
 *
 * Runs {@link validateEmail} and {@link validatePassword} and collects any
 * errors into a single object. Returns `null` when every field is valid so
 * callers can use a simple truthiness check.
 *
 * @param email    - The raw email string supplied by the user.
 * @param password - The raw password string supplied by the user.
 * @returns `null` if both fields are valid, otherwise an object containing
 *          only the keys whose values failed validation.
 *
 * @example
 * validateLoginForm('', '');
 * // { email: 'Email is required', password: 'Password is required' }
 *
 * validateLoginForm('bad', '');
 * // { email: 'Invalid email format', password: 'Password is required' }
 *
 * validateLoginForm('user@example.com', 'secret');
 * // null
 */
export function validateLoginForm(
  email: string,
  password: string,
): LoginFormErrors | null {
  const errors: LoginFormErrors = {};

  const emailError = validateEmail(email);
  if (emailError !== null) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(password);
  if (passwordError !== null) {
    errors.password = passwordError;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

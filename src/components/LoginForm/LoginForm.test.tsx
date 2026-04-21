/**
 * LoginForm.test.tsx
 *
 * Component tests for the LoginForm component using Vitest + React Testing Library.
 *
 * Covers:
 * - Rendering of email input, password input, and submit button
 * - Validation errors for empty/invalid email and empty password
 * - Successful form submission with valid credentials
 * - External error prop rendered in an alert element
 * - Loading state (button label + disabled behaviour)
 * - Field error cleared when user starts typing
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders the LoginForm with sensible defaults and returns common queries. */
function setup(props: Partial<React.ComponentProps<typeof LoginForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(
    <LoginForm
      onSubmit={onSubmit}
      error={null}
      isLoading={false}
      {...props}
    />,
  );

  return {
    onSubmit,
    emailInput: screen.getByTestId('email-input'),
    passwordInput: screen.getByTestId('password-input'),
    submitButton: screen.getByTestId('submit-button'),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoginForm', () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the email input', () => {
      const { emailInput } = setup();
      expect(emailInput).toBeInTheDocument();
    });

    it('renders the password input', () => {
      const { passwordInput } = setup();
      expect(passwordInput).toBeInTheDocument();
    });

    it('renders the submit button with default label', () => {
      const { submitButton } = setup();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('Log In');
    });
  });

  // ── Validation – empty email ───────────────────────────────────────────────

  describe('validation: empty email', () => {
    it('shows a validation error when submitting with an empty email', async () => {
      const user = userEvent.setup();
      const { submitButton } = setup();

      await user.click(submitButton);

      const emailError = await screen.findByTestId('email-error');
      expect(emailError).toBeInTheDocument();
      expect(emailError).toHaveTextContent('Email is required');
    });

    it('marks the email input as aria-invalid when email is empty', async () => {
      const user = userEvent.setup();
      const { submitButton, emailInput } = setup();

      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  // ── Validation – invalid email format ─────────────────────────────────────

  describe('validation: invalid email format', () => {
    it('shows a validation error when submitting with an invalid email', async () => {
      const user = userEvent.setup();
      const { emailInput, passwordInput, submitButton } = setup();

      await user.type(emailInput, 'not-a-valid-email');
      await user.type(passwordInput, 'secret123');
      await user.click(submitButton);

      const emailError = await screen.findByTestId('email-error');
      expect(emailError).toBeInTheDocument();
      expect(emailError).toHaveTextContent('Invalid email format');
    });

    it('does not call onSubmit when the email format is invalid', async () => {
      const user = userEvent.setup();
      const { onSubmit, emailInput, passwordInput, submitButton } = setup();

      await user.type(emailInput, 'bad@');
      await user.type(passwordInput, 'secret123');
      await user.click(submitButton);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // ── Validation – empty password ────────────────────────────────────────────

  describe('validation: empty password', () => {
    it('shows a validation error when submitting with an empty password', async () => {
      const user = userEvent.setup();
      const { emailInput, submitButton } = setup();

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      const passwordError = await screen.findByTestId('password-error');
      expect(passwordError).toBeInTheDocument();
      expect(passwordError).toHaveTextContent('Password is required');
    });

    it('marks the password input as aria-invalid when password is empty', async () => {
      const user = userEvent.setup();
      const { emailInput, passwordInput, submitButton } = setup();

      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  // ── Successful submission ─────────────────────────────────────────────────

  describe('successful submission', () => {
    it('calls onSubmit with email and password when the form is valid', async () => {
      const user = userEvent.setup();
      const { onSubmit, emailInput, passwordInput, submitButton } = setup();

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'secret123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith('user@example.com', 'secret123');
      });
    });

    it('does not display any field errors after a valid submission', async () => {
      const user = userEvent.setup();
      const { emailInput, passwordInput, submitButton } = setup();

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'secret123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
        expect(screen.queryByTestId('password-error')).not.toBeInTheDocument();
      });
    });
  });

  // ── External error prop ────────────────────────────────────────────────────

  describe('error prop', () => {
    it('displays the error prop message in an element with role="alert"', () => {
      setup({ error: 'Invalid credentials. Please try again.' });

      // The server-error element carries role="alert" on the component.
      // RTL computes the accessible name of a bare <div role="alert"> as an
      // empty string (text content is not used as the name for alert roles),
      // so we locate the element via its data-testid and verify the role and
      // content separately.
      const alertElement = screen.getByTestId('server-error');
      expect(alertElement).toBeInTheDocument();
      expect(alertElement).toHaveAttribute('role', 'alert');
      expect(alertElement).toHaveTextContent('Invalid credentials. Please try again.');
    });

    it('does not render a server error element when error prop is null', () => {
      setup({ error: null });
      expect(screen.queryByTestId('server-error')).not.toBeInTheDocument();
    });

    it('does not render a server error element when error prop is omitted', () => {
      setup();
      expect(screen.queryByTestId('server-error')).not.toBeInTheDocument();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('isLoading state', () => {
    it("shows 'Logging in...' as the button label when isLoading is true", () => {
      const { submitButton } = setup({ isLoading: true });
      expect(submitButton).toHaveTextContent('Logging in...');
    });

    it('disables the submit button when isLoading is true', () => {
      const { submitButton } = setup({ isLoading: true });
      expect(submitButton).toBeDisabled();
    });

    it('sets aria-disabled on the submit button when isLoading is true', () => {
      const { submitButton } = setup({ isLoading: true });
      expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('shows the default label and is enabled when isLoading is false', () => {
      const { submitButton } = setup({ isLoading: false });
      expect(submitButton).toHaveTextContent('Log In');
      expect(submitButton).not.toBeDisabled();
    });
  });

  // ── Field error cleared on typing ──────────────────────────────────────────

  describe('clears field errors when user starts typing', () => {
    it('clears the email error when the user types in the email field', async () => {
      const user = userEvent.setup();
      const { emailInput, submitButton } = setup();

      // Trigger the email validation error by submitting with an empty field.
      await user.click(submitButton);
      expect(await screen.findByTestId('email-error')).toBeInTheDocument();

      // Start typing – the error should disappear immediately.
      await user.type(emailInput, 'a');
      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });

    it('clears the password error when the user types in the password field', async () => {
      const user = userEvent.setup();
      const { emailInput, passwordInput, submitButton } = setup();

      // Provide a valid email so only the password error surfaces.
      await user.type(emailInput, 'user@example.com');
      await user.click(submitButton);
      expect(await screen.findByTestId('password-error')).toBeInTheDocument();

      // Start typing – the error should disappear immediately.
      await user.type(passwordInput, 'a');
      await waitFor(() => {
        expect(screen.queryByTestId('password-error')).not.toBeInTheDocument();
      });
    });
  });
});

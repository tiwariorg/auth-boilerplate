/**
 * AuthContext.test.tsx
 *
 * Integration tests for AuthContext and the useAuth hook.
 *
 * Strategy:
 *   - `authenticateUser` (the real network call) is mocked via vi.mock so that
 *     tests run synchronously-fast and remain fully deterministic.
 *   - A `TestConsumer` component is rendered inside `<AuthProvider>` to give
 *     tests a realistic DOM surface for interacting with context state.
 *   - The `renderWithProvider` helper keeps individual test bodies concise by
 *     handling the provider wrapper once in a single place.
 *   - `renderHook` is used where inspecting the hook return value directly is
 *     more expressive than querying a DOM element.
 *
 * Ticket: KAN-3
 */

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from 'vitest';
import {
  render,
  screen,
  waitFor,
  renderHook,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from './AuthContext';
import { authenticateUser } from '../services/authService';

// ---------------------------------------------------------------------------
// Module mock — replace the real authService so tests never hit setTimeout
// ---------------------------------------------------------------------------

vi.mock('../services/authService', () => ({
  authenticateUser: vi.fn(),
}));

/** Typed reference to the mocked function for convenient per-test control. */
const mockAuthenticateUser = authenticateUser as Mock;

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'password123';
const VALID_USER = { email: VALID_EMAIL, name: 'Demo User' };

const INVALID_EMAIL = 'nobody@nowhere.com';
const INVALID_PASSWORD = 'wrong-password';
const AUTH_ERROR_MESSAGE = 'Invalid email or password';

// ---------------------------------------------------------------------------
// Test consumer component
//
// Renders all pieces of auth state to the DOM and exposes buttons that
// trigger the login / logout actions.  Using a realistic consumer component
// (rather than bare `renderHook`) exercises the provider's value memoisation
// and context propagation in the same way real application code would.
// ---------------------------------------------------------------------------

function TestConsumer() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    await login(VALID_EMAIL, VALID_PASSWORD);
  };

  const handleLoginInvalid = async () => {
    await login(INVALID_EMAIL, INVALID_PASSWORD);
  };

  const handleLoginAndCaptureError = async () => {
    const result = await login(INVALID_EMAIL, INVALID_PASSWORD);
    // Write the returned error message into the DOM so tests can assert on it.
    if (!result.success && result.error) {
      const errorEl = document.getElementById('login-result-error');
      if (errorEl) errorEl.textContent = result.error;
    }
  };

  return (
    <div>
      {/* Auth state indicators */}
      <p data-testid="is-authenticated">{String(isAuthenticated)}</p>
      <p data-testid="user-email">{user?.email ?? 'null'}</p>
      <p data-testid="user-name">{user?.name ?? 'null'}</p>

      {/* Writable span for capturing the login error message */}
      <span id="login-result-error" data-testid="login-result-error" />

      {/* Action buttons */}
      <button type="button" onClick={handleLogin}>
        Login Valid
      </button>
      <button type="button" onClick={handleLoginInvalid}>
        Login Invalid
      </button>
      <button type="button" onClick={handleLoginAndCaptureError}>
        Login Invalid Capture Error
      </button>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render helper — wraps the test consumer (or any children) in AuthProvider
// ---------------------------------------------------------------------------

function renderWithProvider(ui: ReactNode = <TestConsumer />) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockAuthenticateUser.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('AuthContext', () => {
  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('renders without errors when wrapped in AuthProvider', () => {
      expect(() => renderWithProvider()).not.toThrow();
    });

    it('exposes user as null before any login attempt', () => {
      renderWithProvider();

      expect(screen.getByTestId('user-email').textContent).toBe('null');
      expect(screen.getByTestId('user-name').textContent).toBe('null');
    });

    it('exposes isAuthenticated as false before any login attempt', () => {
      renderWithProvider();

      expect(screen.getByTestId('is-authenticated').textContent).toBe('false');
    });
  });

  // -------------------------------------------------------------------------
  // Successful login
  // -------------------------------------------------------------------------

  describe('successful login', () => {
    beforeEach(() => {
      // Mock the service to return a successful authentication result.
      mockAuthenticateUser.mockResolvedValue({
        success: true,
        user: VALID_USER,
      });
    });

    it('sets user to the authenticated user after a successful login', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Login Valid' }));

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(VALID_EMAIL);
        expect(screen.getByTestId('user-name').textContent).toBe(
          VALID_USER.name,
        );
      });
    });

    it('sets isAuthenticated to true after a successful login', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Login Valid' }));

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      });
    });

    it('returns { success: true } from the login call', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      });

      mockAuthenticateUser.mockResolvedValue({
        success: true,
        user: VALID_USER,
      });

      let loginResult: { success: boolean; error?: string } | undefined;

      await act(async () => {
        loginResult = await result.current.login(VALID_EMAIL, VALID_PASSWORD);
      });

      expect(loginResult).toEqual({ success: true });
    });

    it('calls authenticateUser with the supplied email and password', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Login Valid' }));

      await waitFor(() => {
        expect(mockAuthenticateUser).toHaveBeenCalledOnce();
        expect(mockAuthenticateUser).toHaveBeenCalledWith(
          VALID_EMAIL,
          VALID_PASSWORD,
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Failed login
  // -------------------------------------------------------------------------

  describe('failed login', () => {
    beforeEach(() => {
      // Mock the service to simulate wrong credentials.
      mockAuthenticateUser.mockResolvedValue({
        success: false,
        error: AUTH_ERROR_MESSAGE,
      });
    });

    it('keeps user as null after a failed login', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Login Invalid' }));

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe('null');
        expect(screen.getByTestId('user-name').textContent).toBe('null');
      });
    });

    it('keeps isAuthenticated as false after a failed login', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Login Invalid' }));

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated').textContent).toBe(
          'false',
        );
      });
    });

    it('returns { success: false, error } from the login call', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      });

      let loginResult: { success: boolean; error?: string } | undefined;

      await act(async () => {
        loginResult = await result.current.login(
          INVALID_EMAIL,
          INVALID_PASSWORD,
        );
      });

      expect(loginResult).toEqual({
        success: false,
        error: AUTH_ERROR_MESSAGE,
      });
    });

    it('surfaces the error message returned by the service', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      await user.click(
        screen.getByRole('button', { name: 'Login Invalid Capture Error' }),
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('login-result-error').textContent,
        ).toBe(AUTH_ERROR_MESSAGE);
      });
    });

    it('does not include a user object in the failed result', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      });

      let loginResult: { success: boolean; error?: string } | undefined;

      await act(async () => {
        loginResult = await result.current.login(
          INVALID_EMAIL,
          INVALID_PASSWORD,
        );
      });

      expect(loginResult).not.toHaveProperty('user');
    });
  });

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  describe('logout', () => {
    beforeEach(() => {
      // A successful login is needed so there is a user to log out.
      mockAuthenticateUser.mockResolvedValue({
        success: true,
        user: VALID_USER,
      });
    });

    it('resets user to null after logout', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      // First — log in so there is a user to clear.
      await user.click(screen.getByRole('button', { name: 'Login Valid' }));
      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe(VALID_EMAIL);
      });

      // Then — log out.
      await user.click(screen.getByRole('button', { name: 'Logout' }));

      await waitFor(() => {
        expect(screen.getByTestId('user-email').textContent).toBe('null');
        expect(screen.getByTestId('user-name').textContent).toBe('null');
      });
    });

    it('resets isAuthenticated to false after logout', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: 'Login Valid' }));
      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      });

      await user.click(screen.getByRole('button', { name: 'Logout' }));

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated').textContent).toBe(
          'false',
        );
      });
    });

    it('allows re-login after logout', async () => {
      renderWithProvider();
      const user = userEvent.setup();

      // Login → logout → login again.
      await user.click(screen.getByRole('button', { name: 'Login Valid' }));
      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
      });

      await user.click(screen.getByRole('button', { name: 'Logout' }));
      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated').textContent).toBe(
          'false',
        );
      });

      await user.click(screen.getByRole('button', { name: 'Login Valid' }));
      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated').textContent).toBe('true');
        expect(screen.getByTestId('user-email').textContent).toBe(VALID_EMAIL);
      });
    });
  });

  // -------------------------------------------------------------------------
  // useAuth outside AuthProvider
  // -------------------------------------------------------------------------

  describe('useAuth used outside AuthProvider', () => {
    it('throws an error when useAuth is called outside of AuthProvider', () => {
      // Suppress the React error boundary console noise for this test.
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });

    it('includes a descriptive message in the thrown error', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      let thrownError: unknown;

      try {
        renderHook(() => useAuth());
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(Error);
      expect((thrownError as Error).message).toMatch(/AuthProvider/);

      consoleError.mockRestore();
    });
  });

  // -------------------------------------------------------------------------
  // Context value stability (memoisation)
  // -------------------------------------------------------------------------

  describe('context value stability', () => {
    it('provides stable login and logout function references across re-renders', async () => {
      const loginRefs: unknown[] = [];
      const logoutRefs: unknown[] = [];

      function RefCapture() {
        const { login, logout } = useAuth();
        loginRefs.push(login);
        logoutRefs.push(logout);
        return null;
      }

      const { rerender } = render(
        <AuthProvider>
          <RefCapture />
        </AuthProvider>,
      );

      // Trigger a re-render of the provider's subtree.
      rerender(
        <AuthProvider>
          <RefCapture />
        </AuthProvider>,
      );

      // useCallback should ensure the references are the same object.
      expect(loginRefs[0]).toBe(loginRefs[1]);
      expect(logoutRefs[0]).toBe(logoutRefs[1]);
    });
  });
});

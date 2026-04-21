/**
 * LoginPage.test.tsx
 *
 * Integration tests for the LoginPage component using Vitest + React Testing
 * Library.
 *
 * Strategy:
 *   - `authenticateUser` (the real network call) is mocked via vi.mock so tests
 *     run fast and remain fully deterministic.
 *   - LoginPage is wrapped in both <AuthProvider> and <MemoryRouter> for every
 *     test so that hooks (useAuth, useNavigate) resolve correctly.
 *   - Navigation tests render both /login and /dashboard routes inside a single
 *     <Routes> tree, allowing assertions on the rendered destination content
 *     rather than relying on spies.
 *   - The "already authenticated" scenario is achieved by pre-logging-in via
 *     a small helper that drives the real AuthProvider login flow before the
 *     LoginPage is displayed.
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
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '../../context/AuthContext';
import { LoginPage } from './LoginPage';
import { DashboardPage } from '../DashboardPage';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { authenticateUser } from '../../services/authService';

// ---------------------------------------------------------------------------
// Module mock — replace the real authService so tests never hit setTimeout
// ---------------------------------------------------------------------------

vi.mock('../../services/authService', () => ({
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

const INVALID_EMAIL = 'wrong@example.com';
const INVALID_PASSWORD = 'badpassword';
const AUTH_ERROR_MESSAGE = 'Invalid email or password';

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/**
 * renderLoginPage
 *
 * Renders LoginPage alone (no /dashboard route) inside AuthProvider and
 * MemoryRouter. Suitable for tests that only need to assert on the login form
 * itself without checking cross-route navigation.
 */
function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

/**
 * renderWithBothRoutes
 *
 * Renders both /login and /dashboard routes inside a single AuthProvider and
 * MemoryRouter, starting at /login. The dashboard is wrapped in ProtectedRoute
 * to mirror the real application routing configuration.
 *
 * Use this helper when a test needs to verify that navigation from /login to
 * /dashboard (or vice-versa) actually occurs.
 */
function renderWithBothRoutes(initialPath = '/login') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

/**
 * PreAuthWrapper
 *
 * An internal helper component used in the "already authenticated" test.
 * It automatically calls login() on mount so the AuthContext user state is
 * populated before LoginPage gets a chance to render, thereby triggering the
 * isAuthenticated redirect.
 */
function PreAuthWrapper({ children }: { children: ReactNode }) {
  const { login } = useAuth();

  // We deliberately fire-and-forget here; the mock resolves synchronously
  // (via mockResolvedValue), so by the first render the state update will
  // be queued and applied on the next tick.
  void login(VALID_EMAIL, VALID_PASSWORD);

  return <>{children}</>;
}

/**
 * renderAlreadyAuthenticated
 *
 * Renders both routes with a pre-authenticated session. The PreAuthWrapper
 * triggers the login action inside the AuthProvider before the route content
 * renders, simulating a user who is already signed in when they visit /login.
 */
function renderAlreadyAuthenticated() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <PreAuthWrapper>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </PreAuthWrapper>
      </MemoryRouter>
    </AuthProvider>,
  );
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

describe('LoginPage', () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('renders login form on the page', () => {
    it('renders the login page wrapper element', () => {
      renderLoginPage();

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('renders a visible "Login" heading', () => {
      renderLoginPage();

      expect(
        screen.getByRole('heading', { name: /login/i }),
      ).toBeInTheDocument();
    });

    it('renders the login form', () => {
      renderLoginPage();

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('renders an email input', () => {
      renderLoginPage();

      expect(screen.getByTestId('email-input')).toBeInTheDocument();
    });

    it('renders a password input', () => {
      renderLoginPage();

      expect(screen.getByTestId('password-input')).toBeInTheDocument();
    });

    it('renders a submit button', () => {
      renderLoginPage();

      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    it('does not display a server error on initial render', () => {
      renderLoginPage();

      expect(screen.queryByTestId('server-error')).not.toBeInTheDocument();
    });

    it('does not display the dashboard content on the login page', () => {
      renderLoginPage();

      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });
  });

  // ── Successful login → navigation to /dashboard ───────────────────────────

  describe('successful login navigates to /dashboard', () => {
    beforeEach(() => {
      mockAuthenticateUser.mockResolvedValue({
        success: true,
        user: VALID_USER,
      });
    });

    it('navigates away from /login and shows the dashboard page after valid credentials', async () => {
      const user = userEvent.setup();
      renderWithBothRoutes();

      // Fill in valid credentials and submit.
      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      // The dashboard page should now be in the document.
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('no longer shows the login page after successful navigation', async () => {
      const user = userEvent.setup();
      renderWithBothRoutes();

      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      });
    });

    it('shows the dashboard heading after successful login', async () => {
      const user = userEvent.setup();
      renderWithBothRoutes();

      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /dashboard/i }),
        ).toBeInTheDocument();
      });
    });

    it('calls authenticateUser with the supplied credentials', async () => {
      const user = userEvent.setup();
      renderWithBothRoutes();

      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockAuthenticateUser).toHaveBeenCalledOnce();
        expect(mockAuthenticateUser).toHaveBeenCalledWith(
          VALID_EMAIL,
          VALID_PASSWORD,
        );
      });
    });

    it('shows the submit button in loading state while the request is in flight', async () => {
      // Use a never-resolving promise to hold the loading state open.
      mockAuthenticateUser.mockReturnValue(new Promise(() => {}));

      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toHaveTextContent(
          'Logging in...',
        );
        expect(screen.getByTestId('submit-button')).toBeDisabled();
      });
    });
  });

  // ── Failed login → error message ──────────────────────────────────────────

  describe('failed login displays error message on the page', () => {
    beforeEach(() => {
      mockAuthenticateUser.mockResolvedValue({
        success: false,
        error: AUTH_ERROR_MESSAGE,
      });
    });

    it('displays the server error message returned by the auth service', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByTestId('email-input'), INVALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), INVALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('server-error')).toBeInTheDocument();
        expect(screen.getByTestId('server-error')).toHaveTextContent(
          AUTH_ERROR_MESSAGE,
        );
      });
    });

    it('renders the error in an element with role="alert"', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByTestId('email-input'), INVALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), INVALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        const alertEl = screen.getByTestId('server-error');
        expect(alertEl).toHaveAttribute('role', 'alert');
      });
    });

    it('stays on the login page after a failed login', async () => {
      const user = userEvent.setup();
      renderWithBothRoutes();

      await user.type(screen.getByTestId('email-input'), INVALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), INVALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
      });
    });

    it('does not call authenticateUser when field validation fails (empty form)', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      // Submit without filling in any fields — client-side validation should
      // block the call to authenticateUser entirely.
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockAuthenticateUser).not.toHaveBeenCalled();
      });
    });

    it('re-enables the submit button and resets loading state after a failed request', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByTestId('email-input'), INVALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), INVALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        const submitButton = screen.getByTestId('submit-button');
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent('Log In');
      });
    });

    it('displays the fallback error message when the service returns no error string', async () => {
      // Override: service returns success:false but omits the error field.
      mockAuthenticateUser.mockResolvedValue({ success: false });

      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByTestId('email-input'), INVALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), INVALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('server-error')).toHaveTextContent(
          'An unexpected error occurred. Please try again.',
        );
      });
    });
  });

  // ── Already authenticated → redirect to /dashboard ────────────────────────

  describe('redirects to /dashboard when the user is already authenticated', () => {
    beforeEach(() => {
      // The PreAuthWrapper triggers login() on mount, so the mock must be set
      // up before rendering.
      mockAuthenticateUser.mockResolvedValue({
        success: true,
        user: VALID_USER,
      });
    });

    it('shows the dashboard page instead of the login page', async () => {
      renderAlreadyAuthenticated();

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it('does not render the login page when already authenticated', async () => {
      renderAlreadyAuthenticated();

      await waitFor(() => {
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      });
    });

    it('shows the dashboard heading when redirected from login', async () => {
      renderAlreadyAuthenticated();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /dashboard/i }),
        ).toBeInTheDocument();
      });
    });
  });
});

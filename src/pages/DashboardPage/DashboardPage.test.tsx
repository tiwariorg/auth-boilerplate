/**
 * DashboardPage.test.tsx
 *
 * Integration tests for ProtectedRoute and DashboardPage using
 * Vitest + React Testing Library.
 *
 * Strategy:
 *   - `authenticateUser` is mocked via vi.mock so tests never hit the real
 *     async service delay and remain fully deterministic.
 *   - ProtectedRoute tests render a minimal route tree inside MemoryRouter.
 *     For unauthenticated state the default AuthProvider (no login) is used.
 *     For authenticated state `useAuth` is mocked to return a pre-populated
 *     context so that ProtectedRoute's synchronous `isAuthenticated` check
 *     passes on the very first render — avoiding the async PreAuthWrapper
 *     race that arises when the initial route is already /dashboard.
 *   - DashboardPage display tests also use the mocked `useAuth` approach to
 *     guarantee the user object is available synchronously.
 *   - Logout / navigation tests use the real AuthProvider + PreAuthWrapper
 *     pattern (as in LoginPage.test.tsx) but start at /login so that the
 *     router lands on a renderable page first; then a form submission drives
 *     navigation to /dashboard.
 *   - Navigation is verified by rendering multiple routes in a single <Routes>
 *     tree and asserting on which page-level element appears in the DOM.
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

import { AuthProvider } from '../../context/AuthContext';
import * as AuthContextModule from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { DashboardPage } from './DashboardPage';
import { LoginPage } from '../LoginPage';
import { authenticateUser } from '../../services/authService';
import type { User } from '../../types/auth';

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
const VALID_USER: User = { email: VALID_EMAIL, name: 'Demo User' };

// ---------------------------------------------------------------------------
// useAuth mock helpers
//
// For tests that need an already-authenticated context synchronously (e.g.
// when the initial route is /dashboard and ProtectedRoute checks
// `isAuthenticated` before any async action can settle), we spy on `useAuth`
// and replace its return value with a fully-populated auth context.
// ---------------------------------------------------------------------------

/** Builds a mock AuthContext value that looks like a logged-in user. */
function buildAuthenticatedContext(
  overrides: Partial<ReturnType<typeof AuthContextModule.useAuth>> = {},
): ReturnType<typeof AuthContextModule.useAuth> {
  return {
    user: VALID_USER,
    isAuthenticated: true,
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
    ...overrides,
  };
}

/** Builds a mock AuthContext value that looks like a logged-out user. */
function buildUnauthenticatedContext(): ReturnType<typeof AuthContextModule.useAuth> {
  return {
    user: null,
    isAuthenticated: false,
    login: vi.fn().mockResolvedValue({ success: false, error: 'Not logged in' }),
    logout: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * A minimal sentinel component rendered at /login so redirect tests can confirm
 * that the router has navigated away from the protected route without needing
 * the full LoginPage dependency.
 */
function LoginSentinel() {
  return <div data-testid="login-sentinel">Login Page</div>;
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

/**
 * renderProtectedWithSentinel
 *
 * Renders a /dashboard route (wrapped in ProtectedRoute) alongside a /login
 * sentinel route, starting at /dashboard. The AuthProvider is real but has no
 * pre-seeded user — suitable for unauthenticated redirect tests.
 */
function renderProtectedWithSentinel() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<LoginSentinel />} />
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
 * renderProtectedAuthenticated
 *
 * Renders the same route tree as `renderProtectedWithSentinel` but with
 * `useAuth` mocked to return an authenticated context, so ProtectedRoute's
 * synchronous `isAuthenticated` check passes on the first render.
 */
function renderProtectedAuthenticated(
  authContext?: Partial<ReturnType<typeof AuthContextModule.useAuth>>,
) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
    buildAuthenticatedContext(authContext),
  );

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<LoginSentinel />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * renderDashboardAuthenticated
 *
 * Renders DashboardPage alone (no ProtectedRoute wrapper) with `useAuth`
 * mocked to return a populated authenticated context. Suitable for testing
 * DashboardPage's own rendering without involving guard logic.
 */
function renderDashboardAuthenticated(
  authContext?: Partial<ReturnType<typeof AuthContextModule.useAuth>>,
) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue(
    buildAuthenticatedContext(authContext),
  );

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<LoginSentinel />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * renderFullRouteTree
 *
 * Renders both the real /login (LoginPage) and /dashboard (ProtectedRoute +
 * DashboardPage) routes inside a genuine AuthProvider, starting at the given
 * `initialPath`. Suitable for end-to-end navigation tests driven by real user
 * interactions (form submission → navigate → logout → navigate back).
 */
function renderFullRouteTree(initialPath = '/login') {
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

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockAuthenticateUser.mockReset();
  // Default: successful auth — used by renderFullRouteTree login flow tests.
  mockAuthenticateUser.mockResolvedValue({
    success: true,
    user: VALID_USER,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

// ============================================================================
// ProtectedRoute
// ============================================================================

describe('ProtectedRoute', () => {
  // --------------------------------------------------------------------------
  // Unauthenticated — redirect to /login
  // --------------------------------------------------------------------------

  describe('when the user is NOT authenticated', () => {
    it('redirects to /login and renders the login sentinel', () => {
      // Real AuthProvider starts with user=null → isAuthenticated=false.
      renderProtectedWithSentinel();

      expect(screen.getByTestId('login-sentinel')).toBeInTheDocument();
    });

    it('does NOT render the protected children', () => {
      renderProtectedWithSentinel();

      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });

    it('renders content at the /login route after the redirect', () => {
      renderProtectedWithSentinel();

      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Authenticated — renders children
  // --------------------------------------------------------------------------

  describe('when the user IS authenticated', () => {
    it('renders the protected children', () => {
      renderProtectedAuthenticated();

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('does NOT redirect to /login', () => {
      renderProtectedAuthenticated();

      expect(screen.queryByTestId('login-sentinel')).not.toBeInTheDocument();
    });

    it('renders the Dashboard heading inside the protected route', () => {
      renderProtectedAuthenticated();

      expect(
        screen.getByRole('heading', { name: /dashboard/i }),
      ).toBeInTheDocument();
    });

    it('passes the user information down to the child component', () => {
      renderProtectedAuthenticated();

      // DashboardPage renders UserInfo which shows the user's name.
      expect(
        screen.getByText(`Welcome, ${VALID_USER.name}!`),
      ).toBeInTheDocument();
    });
  });
});

// ============================================================================
// DashboardPage
// ============================================================================

describe('DashboardPage', () => {
  // --------------------------------------------------------------------------
  // Rendering — user information
  // --------------------------------------------------------------------------

  describe("displays the authenticated user's information", () => {
    it("renders the user's name on the page", () => {
      renderDashboardAuthenticated();

      expect(
        screen.getByText(`Welcome, ${VALID_USER.name}!`),
      ).toBeInTheDocument();
    });

    it("renders the user's email on the page", () => {
      renderDashboardAuthenticated();

      // The email is rendered inside a <span> within the UserInfo card.
      expect(screen.getByText(VALID_USER.email)).toBeInTheDocument();
    });

    it('renders the UserInfo card element', () => {
      renderDashboardAuthenticated();

      expect(screen.getByTestId('user-info-card')).toBeInTheDocument();
    });

    it('renders the dashboard page wrapper element', () => {
      renderDashboardAuthenticated();

      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('renders a "Dashboard" heading', () => {
      renderDashboardAuthenticated();

      expect(
        screen.getByRole('heading', { name: /dashboard/i }),
      ).toBeInTheDocument();
    });

    it('renders the Log Out button', () => {
      renderDashboardAuthenticated();

      expect(
        screen.getByRole('button', { name: /log out/i }),
      ).toBeInTheDocument();
    });

    it('renders the Log Out button with the correct accessible label', () => {
      renderDashboardAuthenticated();

      expect(
        screen.getByRole('button', { name: /log out/i }),
      ).toHaveAttribute('aria-label', 'Log out of your account');
    });
  });

  // --------------------------------------------------------------------------
  // Logout — clears auth and redirects to /login
  // --------------------------------------------------------------------------

  describe('logout button', () => {
    it('calls logout from AuthContext when the Log Out button is clicked', async () => {
      const mockLogout = vi.fn();
      renderDashboardAuthenticated({ logout: mockLogout });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /log out/i }));

      expect(mockLogout).toHaveBeenCalledOnce();
    });

    it('navigates to /login after logout (sentinel route)', async () => {
      // logout is a no-op stub; navigation is still triggered by DashboardPage.
      renderDashboardAuthenticated({ logout: vi.fn() });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /log out/i }));

      await waitFor(() => {
        expect(screen.getByTestId('login-sentinel')).toBeInTheDocument();
      });
    });

    it('removes the dashboard page from the document after logout', async () => {
      renderDashboardAuthenticated({ logout: vi.fn() });

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /log out/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
      });
    });
  });

  // --------------------------------------------------------------------------
  // Integration — full login → dashboard → logout flow
  // --------------------------------------------------------------------------

  describe('full login → dashboard → logout flow', () => {
    it('shows the dashboard after a successful login', async () => {
      const user = userEvent.setup();
      renderFullRouteTree('/login');

      // The login page should be visible initially.
      expect(screen.getByTestId('login-page')).toBeInTheDocument();

      // Fill in valid credentials and submit.
      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      // The dashboard should now be rendered.
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });
    });

    it("shows the user's name on the dashboard after login", async () => {
      const user = userEvent.setup();
      renderFullRouteTree('/login');

      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(
          screen.getByText(`Welcome, ${VALID_USER.name}!`),
        ).toBeInTheDocument();
      });
    });

    it("shows the user's email on the dashboard after login", async () => {
      const user = userEvent.setup();
      renderFullRouteTree('/login');

      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByText(VALID_USER.email)).toBeInTheDocument();
      });
    });

    it('returns to the login page after clicking Log Out', async () => {
      const user = userEvent.setup();
      renderFullRouteTree('/login');

      // Log in first.
      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      // Now log out.
      await user.click(screen.getByRole('button', { name: /log out/i }));

      // Should be redirected back to login.
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('removes the dashboard from the document after logout', async () => {
      const user = userEvent.setup();
      renderFullRouteTree('/login');

      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /log out/i }));

      await waitFor(() => {
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
      });
    });

    it('shows the Login heading after logout navigation', async () => {
      const user = userEvent.setup();
      renderFullRouteTree('/login');

      await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
      await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /log out/i }));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /login/i }),
        ).toBeInTheDocument();
      });
    });
  });
});

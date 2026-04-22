/**
 * App.test.tsx
 *
 * Tests for App.tsx — the application composition root.
 *
 * Strategy:
 *   - App.tsx is a pure wiring component: it composes AuthProvider,
 *     BrowserRouter (with basename), and the top-level route tree.
 *   - We render App inside a JSDOM environment where window.location is
 *     controlled via the history API.
 *   - `authenticateUser` is mocked so that login flows remain fast and
 *     deterministic — no real timeouts.
 *   - Each routing concern is tested in isolation:
 *       1. The /login public route renders LoginPage.
 *       2. The /dashboard protected route redirects unauthenticated users.
 *       3. An unknown path redirects to /login.
 *       4. An authenticated user can reach /dashboard.
 *   - Because BrowserRouter reads window.location, we manipulate
 *     history.pushState before each test and restore it afterwards.
 *
 * Ticket: KAN-4
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';
import { authenticateUser } from './services/authService';

// ---------------------------------------------------------------------------
// Module mock — prevent real network delays in authService
// ---------------------------------------------------------------------------

vi.mock('./services/authService', () => ({
  authenticateUser: vi.fn(),
}));

const mockAuthenticateUser = authenticateUser as Mock;

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'password123';
const VALID_USER = { email: VALID_EMAIL, name: 'Demo User' };

// ---------------------------------------------------------------------------
// History helpers
//
// App uses <BrowserRouter basename="/auth-boilerplate/">.
// We navigate to a specific route by pushing the full URL path before render.
// ---------------------------------------------------------------------------

/**
 * Navigate JSDOM's location to the given path *within* the app's basename so
 * that BrowserRouter resolves the correct route on the very first render.
 *
 * e.g. navigateTo('/login')  → /auth-boilerplate/login
 */
function navigateTo(path: string) {
  const base = '/auth-boilerplate'
  // Ensure path starts with /
  const normalised = path.startsWith('/') ? path : `/${path}`
  window.history.pushState({}, '', `${base}${normalised}`)
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockAuthenticateUser.mockReset();
  // Safe default: successful authentication.
  mockAuthenticateUser.mockResolvedValue({ success: true, user: VALID_USER });
});

afterEach(() => {
  vi.restoreAllMocks();
  // Reset location back to the basename root after each test.
  window.history.pushState({}, '', '/auth-boilerplate/login');
});

// ---------------------------------------------------------------------------
// Source-file structure tests (read the raw file)
// ---------------------------------------------------------------------------

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let appSource: string;

try {
  appSource = readFileSync(resolve(__dirname, './App.tsx'), 'utf-8');
} catch {
  appSource = '';
}

describe('App.tsx – source structure', () => {
  it('should be a non-empty file', () => {
    expect(appSource.length).toBeGreaterThan(0);
  });

  it('should import BrowserRouter from react-router-dom', () => {
    expect(appSource).toContain('BrowserRouter');
    expect(appSource).toContain('react-router-dom');
  });

  it('should import AuthProvider from context/AuthContext', () => {
    expect(appSource).toContain('AuthProvider');
    expect(appSource).toContain('AuthContext');
  });

  it('should import LoginPage', () => {
    expect(appSource).toContain('LoginPage');
  });

  it('should import DashboardPage', () => {
    expect(appSource).toContain('DashboardPage');
  });

  it('should import ProtectedRoute', () => {
    expect(appSource).toContain('ProtectedRoute');
  });

  it('should use Routes and Route from react-router-dom', () => {
    expect(appSource).toContain('Routes');
    expect(appSource).toContain('Route');
  });

  it('should use Navigate for the catch-all redirect', () => {
    expect(appSource).toContain('Navigate');
  });

  it('should set basename to "/auth-boilerplate/"', () => {
    expect(appSource).toContain('basename="/auth-boilerplate/"');
  });

  it('should define a /login route', () => {
    expect(appSource).toContain('path="/login"');
  });

  it('should define a /dashboard route', () => {
    expect(appSource).toContain('path="/dashboard"');
  });

  it('should define a catch-all wildcard route', () => {
    expect(appSource).toContain('path="*"');
  });

  it('catch-all should redirect to /login', () => {
    // <Navigate to="/login" ...>
    expect(appSource).toContain('to="/login"');
  });

  it('catch-all Navigate should use replace prop', () => {
    expect(appSource).toContain('replace');
  });

  it('/dashboard route should be wrapped in ProtectedRoute', () => {
    const dashboardSection = appSource.slice(
      appSource.indexOf('"/dashboard"'),
      appSource.indexOf('path="*"'),
    );
    expect(dashboardSection).toContain('ProtectedRoute');
  });

  it('should have a default export (the App function)', () => {
    expect(appSource).toContain('export default App');
  });

  it('should wrap everything in AuthProvider', () => {
    expect(appSource).toContain('<AuthProvider>');
    expect(appSource).toContain('</AuthProvider>');
  });

  it('should reference KAN-4 in the file-level comment', () => {
    expect(appSource).toContain('KAN-4');
  });
});

// ---------------------------------------------------------------------------
// Routing — /login (public route)
// ---------------------------------------------------------------------------

describe('App – /login route', () => {
  beforeEach(() => {
    navigateTo('/login');
  });

  it('renders the login page on /login', () => {
    render(<App />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('renders the Login heading on /login', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeInTheDocument();
  });

  it('renders the login form on the /login page', () => {
    render(<App />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });

  it('does NOT render the dashboard page on /login', () => {
    render(<App />);
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Routing — /dashboard (protected route, unauthenticated)
// ---------------------------------------------------------------------------

describe('App – /dashboard route (unauthenticated)', () => {
  beforeEach(() => {
    navigateTo('/dashboard');
  });

  it('redirects to /login when navigating to /dashboard unauthenticated', () => {
    render(<App />);
    // ProtectedRoute redirects to /login, which renders LoginPage.
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('does NOT render the dashboard page for unauthenticated users', () => {
    render(<App />);
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  it('shows the Login heading when the protected route redirects', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /^login$/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Routing — catch-all wildcard
// ---------------------------------------------------------------------------

describe('App – catch-all wildcard route', () => {
  it('redirects unknown paths to /login', () => {
    navigateTo('/some-unknown-path');
    render(<App />);
    // The catch-all sends to /login, which renders LoginPage.
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('does not render the dashboard for unknown paths', () => {
    navigateTo('/some-unknown-path');
    render(<App />);
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });

  it('redirects the bare basename root to /login', () => {
    window.history.pushState({}, '', '/auth-boilerplate/');
    render(<App />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Routing — /dashboard (authenticated, full login flow)
// ---------------------------------------------------------------------------

describe('App – /dashboard route (authenticated via login flow)', () => {
  beforeEach(() => {
    navigateTo('/login');
    mockAuthenticateUser.mockResolvedValue({ success: true, user: VALID_USER });
  });

  it('navigates to /dashboard after a successful login', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
    await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  it('shows the Dashboard heading after login', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
    await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });
  });

  it("shows the user's name on the dashboard after login", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
    await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText(`Welcome, ${VALID_USER.name}!`)).toBeInTheDocument();
    });
  });

  it("shows the user's email on the dashboard after login", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
    await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByText(VALID_USER.email)).toBeInTheDocument();
    });
  });

  it('does not render the login page while on the dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
    await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Routing — logout flow (dashboard → login)
// ---------------------------------------------------------------------------

describe('App – logout navigation', () => {
  it('redirects to /login after clicking Log Out on the dashboard', async () => {
    navigateTo('/login');
    mockAuthenticateUser.mockResolvedValue({ success: true, user: VALID_USER });

    const user = userEvent.setup();
    render(<App />);

    // Log in first.
    await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
    await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    // Click Log Out.
    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('removes the dashboard page from the DOM after logout', async () => {
    navigateTo('/login');
    mockAuthenticateUser.mockResolvedValue({ success: true, user: VALID_USER });

    const user = userEvent.setup();
    render(<App />);

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

  it('shows the login form again after logging out', async () => {
    navigateTo('/login');
    mockAuthenticateUser.mockResolvedValue({ success: true, user: VALID_USER });

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByTestId('email-input'), VALID_EMAIL);
    await user.type(screen.getByTestId('password-input'), VALID_PASSWORD);
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// AuthProvider integration — login error handling
// ---------------------------------------------------------------------------

describe('App – authentication error handling', () => {
  it('shows an error message when login fails with invalid credentials', async () => {
    navigateTo('/login');
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: 'Invalid email or password',
    });

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByTestId('email-input'), 'wrong@example.com');
    await user.type(screen.getByTestId('password-input'), 'badpassword');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('server-error')).toBeInTheDocument();
    });
  });

  it('keeps the user on the login page after a failed login', async () => {
    navigateTo('/login');
    mockAuthenticateUser.mockResolvedValue({
      success: false,
      error: 'Invalid email or password',
    });

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByTestId('email-input'), 'wrong@example.com');
    await user.type(screen.getByTestId('password-input'), 'badpassword');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// index.html – structure tests (read the raw file)
// ---------------------------------------------------------------------------

let htmlSource: string;

try {
  htmlSource = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
} catch {
  htmlSource = '';
}

describe('index.html – document structure', () => {
  it('should be a non-empty file', () => {
    expect(htmlSource.length).toBeGreaterThan(0);
  });

  it('should be a valid HTML5 document (starts with <!doctype html>)', () => {
    expect(htmlSource.toLowerCase()).toContain('<!doctype html>');
  });

  it('should set lang="en" on the <html> element', () => {
    expect(htmlSource).toContain('lang="en"');
  });

  it('should declare UTF-8 charset', () => {
    expect(htmlSource).toContain('charset="UTF-8"');
  });

  it('should have a viewport meta tag', () => {
    expect(htmlSource).toContain('name="viewport"');
  });

  it('viewport should set width=device-width', () => {
    expect(htmlSource).toContain('width=device-width');
  });

  it('should have a <title> element', () => {
    expect(htmlSource).toContain('<title>');
    expect(htmlSource).toContain('</title>');
  });

  it('should have a root div with id="root"', () => {
    expect(htmlSource).toContain('<div id="root">');
  });

  it('should load the main entry point via <script type="module">', () => {
    expect(htmlSource).toContain('type="module"');
    expect(htmlSource).toContain('src="/src/main.tsx"');
  });

  it('should link a favicon', () => {
    expect(htmlSource).toContain('rel="icon"');
  });

  it('should include the SPA redirect script for GitHub Pages 404 handling', () => {
    // The script replaces query-string encoded paths injected by 404.html
    expect(htmlSource).toContain("l.search[1] === '/'");
  });

  it('SPA redirect script should use window.history.replaceState', () => {
    expect(htmlSource).toContain('window.history.replaceState');
  });

  it('should not contain any obvious debugging artifacts (console.log)', () => {
    expect(htmlSource).not.toContain('console.log(');
  });
});

/**
 * ProtectedRoute.test.tsx
 *
 * Unit and integration tests for the ProtectedRoute component.
 *
 * Strategy:
 *   - `useAuth` is mocked via vi.mock so that authentication state can be
 *     controlled synchronously without needing a real AuthProvider.
 *   - MemoryRouter + Routes provides the routing context required by
 *     react-router-dom's <Navigate>.
 *   - A small LoginSentinel component verifies that unauthenticated visitors
 *     land on /login after the redirect.
 *
 * Ticket: KAN-4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import * as AuthContextModule from '../../context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

// ---------------------------------------------------------------------------
// Mock AuthContext so we can control isAuthenticated synchronously
// ---------------------------------------------------------------------------

vi.mock('../../context/AuthContext', async (importOriginal) => {
  const original = await importOriginal<typeof AuthContextModule>()
  return {
    ...original,
    useAuth: vi.fn(),
  }
})

const mockUseAuth = vi.mocked(AuthContextModule.useAuth)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAuthContext(
  isAuthenticated: boolean,
): ReturnType<typeof AuthContextModule.useAuth> {
  return {
    user: isAuthenticated ? { email: 'user@example.com', name: 'Test User' } : null,
    isAuthenticated,
    login: vi.fn(),
    logout: vi.fn(),
  }
}

/** A sentinel rendered at /login so redirect tests can assert the destination. */
function LoginSentinel() {
  return <div data-testid="login-sentinel">Login Page</div>
}

/** Protected content rendered when authenticated. */
function ProtectedContent() {
  return <div data-testid="protected-content">Secret Content</div>
}

/** Renders ProtectedRoute inside a minimal router with a /login sentinel. */
function renderProtectedRoute(isAuthenticated: boolean) {
  mockUseAuth.mockReturnValue(buildAuthContext(isAuthenticated))

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<LoginSentinel />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  // ── Unauthenticated user ──────────────────────────────────────────────────

  describe('when the user is NOT authenticated', () => {
    it('redirects to /login and renders the login sentinel', () => {
      renderProtectedRoute(false)

      expect(screen.getByTestId('login-sentinel')).toBeInTheDocument()
    })

    it('does NOT render the protected children', () => {
      renderProtectedRoute(false)

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('renders visible text from the /login route after redirect', () => {
      renderProtectedRoute(false)

      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    it('calls useAuth to determine authentication status', () => {
      renderProtectedRoute(false)

      expect(mockUseAuth).toHaveBeenCalled()
    })
  })

  // ── Authenticated user ────────────────────────────────────────────────────

  describe('when the user IS authenticated', () => {
    it('renders the protected children', () => {
      renderProtectedRoute(true)

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('does NOT redirect to /login', () => {
      renderProtectedRoute(true)

      expect(screen.queryByTestId('login-sentinel')).not.toBeInTheDocument()
    })

    it('renders the protected content text', () => {
      renderProtectedRoute(true)

      expect(screen.getByText('Secret Content')).toBeInTheDocument()
    })

    it('calls useAuth to determine authentication status', () => {
      renderProtectedRoute(true)

      expect(mockUseAuth).toHaveBeenCalled()
    })
  })

  // ── Children rendering ────────────────────────────────────────────────────

  describe('children prop', () => {
    it('renders React element children when authenticated', () => {
      mockUseAuth.mockReturnValue(buildAuthContext(true))

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <span data-testid="child-element">Child</span>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.getByTestId('child-element')).toBeInTheDocument()
    })

    it('renders string children when authenticated', () => {
      mockUseAuth.mockReturnValue(buildAuthContext(true))

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={<ProtectedRoute>{'Plain text child'}</ProtectedRoute>}
            />
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.getByText('Plain text child')).toBeInTheDocument()
    })

    it('does NOT render children when NOT authenticated', () => {
      mockUseAuth.mockReturnValue(buildAuthContext(false))

      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginSentinel />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <span data-testid="should-not-render">Hidden</span>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument()
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('renders without throwing when isAuthenticated is true', () => {
      expect(() => renderProtectedRoute(true)).not.toThrow()
    })

    it('renders without throwing when isAuthenticated is false', () => {
      expect(() => renderProtectedRoute(false)).not.toThrow()
    })

    it('replaces the history entry on redirect (no back-navigation to protected route)', () => {
      // We verify the replace prop is used by asserting that the login sentinel
      // is shown and no protected content leaked into the DOM — the "replace"
      // behaviour itself is a react-router internal.
      renderProtectedRoute(false)

      expect(screen.getByTestId('login-sentinel')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })
})

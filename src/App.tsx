/**
 * App.tsx
 *
 * Composition root for the application.
 *
 * Responsibilities:
 *   - Provides application-wide authentication state via <AuthProvider>.
 *   - Establishes client-side routing via <BrowserRouter>.
 *   - Sets `basename='/auth-boilerplate/'` so that all client-side routes are
 *     served under the GitHub Pages subdirectory without requiring every
 *     <Link>, <Navigate>, or navigate() call to repeat the prefix.
 *   - Declares the top-level route tree:
 *       /login      → LoginPage (public)
 *       /dashboard  → DashboardPage (protected — requires authentication)
 *       *           → redirect to /login (catch-all)
 *
 * Props: none
 * State: none — this is a pure composition/wiring component.
 *
 * Ticket: KAN-4
 */

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/ProtectedRoute';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * App
 *
 * The application root. Wraps all children in the authentication context and
 * the browser router, then defines the top-level route configuration.
 *
 * The `basename` prop on <BrowserRouter> instructs React Router to treat
 * '/auth-boilerplate/' as the root of the app, so all route paths and
 * navigation helpers (navigate(), <Link to="">, <Navigate to="">) remain
 * relative to that root (e.g. '/login' resolves to '/auth-boilerplate/login').
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/auth-boilerplate/">
        <Routes>
          {/* Public route — accessible without authentication */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected route — redirects to /login if unauthenticated */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all — redirect any unmatched path to /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

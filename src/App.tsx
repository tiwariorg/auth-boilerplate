/**
 * App.tsx
 *
 * Composition root for the application.
 *
 * Responsibilities:
 *   - Provides application-wide authentication state via <AuthProvider>.
 *   - Establishes client-side routing via <BrowserRouter>.
 *   - Declares the top-level route tree:
 *       /login      → LoginPage (public)
 *       /dashboard  → DashboardPage (protected — requires authentication)
 *       *           → redirect to /login (catch-all)
 *
 * Props: none
 * State: none — this is a pure composition/wiring component.
 *
 * Ticket: KAN-3
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
 */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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

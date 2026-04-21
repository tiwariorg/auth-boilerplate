/**
 * ProtectedRoute.tsx
 *
 * A route-guarding wrapper component that restricts access to authenticated
 * users only.
 *
 * Logic:
 *   - Reads `isAuthenticated` from the AuthContext via `useAuth()`.
 *   - If the user is NOT authenticated, issues a declarative redirect to
 *     `/login` using react-router-dom's `<Navigate>` component. The `replace`
 *     prop is used so that the login page replaces the protected route in the
 *     browser history, preventing the user from navigating "back" to a
 *     protected page after being redirected.
 *   - If the user IS authenticated, renders the `children` prop so that the
 *     wrapped route content is displayed normally.
 *
 * Usage:
 *   ```tsx
 *   <Route
 *     path="/dashboard"
 *     element={
 *       <ProtectedRoute>
 *         <DashboardPage />
 *       </ProtectedRoute>
 *     }
 *   />
 *   ```
 *
 * Ticket: KAN-3
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProtectedRouteProps {
  /** The protected content to render when the user is authenticated. */
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ProtectedRoute
 *
 * Wraps a route's element to ensure only authenticated users can access it.
 * Unauthenticated visitors are transparently redirected to the login page.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

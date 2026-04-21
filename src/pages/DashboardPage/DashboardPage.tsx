/**
 * DashboardPage.tsx
 *
 * Route-level component for /dashboard.
 *
 * Responsibilities:
 *   - Reads the currently authenticated user and the logout function from
 *     AuthContext via the `useAuth` hook.
 *   - Renders a welcome section using the `UserInfo` component when a user
 *     is present.
 *   - Provides a prominent Log Out button that clears the auth session and
 *     redirects the user to /login.
 *
 * Props: none — state is derived from useAuth() and useNavigate().
 *
 * Ticket: KAN-3
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserInfo } from '../../components/UserInfo';
import styles from './DashboardPage.module.css';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DashboardPage
 *
 * Renders a vertically and horizontally centered layout containing a page
 * heading, the authenticated user's information card, and a logout button.
 */
export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  /**
   * Clears the authenticated session and redirects to the login page.
   * Intentionally synchronous — `logout` is a simple state reset with no
   * async side-effects.
   */
  function handleLogout(): void {
    logout();
    navigate('/login');
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className={styles.page} data-testid="dashboard-page">
      <h1 className={styles.heading}>Dashboard</h1>

      {user && <UserInfo user={user} />}

      <button
        type="button"
        className={styles.logoutButton}
        onClick={handleLogout}
        aria-label="Log out of your account"
      >
        Log Out
      </button>
    </div>
  );
}

export default DashboardPage;

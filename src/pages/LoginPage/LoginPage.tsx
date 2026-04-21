/**
 * LoginPage.tsx
 *
 * Route-level component for /login.
 *
 * Responsibilities:
 *   - Redirect already-authenticated users to /dashboard immediately.
 *   - Delegate credential submission to the `login` function from AuthContext.
 *   - Surface server-level errors and loading state down to LoginForm.
 *   - Navigate to /dashboard on successful authentication.
 *
 * Props: none — state is derived from useAuth() and useNavigate().
 *
 * Ticket: KAN-3
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoginForm } from '../../components/LoginForm';
import styles from './LoginPage.module.css';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * LoginPage
 *
 * Renders a centered login card consisting of a heading and the LoginForm.
 * Already-authenticated users are redirected to /dashboard via a useEffect.
 */
export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // Redirect authenticated users away from the login page
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // -------------------------------------------------------------------------
  // Form submission handler
  // -------------------------------------------------------------------------

  /**
   * Attempts to log in with the supplied credentials.
   * On success, navigates to /dashboard.
   * On failure, surfaces the error message returned by the auth service.
   */
  async function handleLogin(email: string, password: string): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(email, password);

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error ?? 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className={styles.page} data-testid="login-page">
      <h1 className={styles.heading}>Login</h1>
      <LoginForm
        onSubmit={handleLogin}
        error={error}
        isLoading={isLoading}
      />
    </div>
  );
}

export default LoginPage;

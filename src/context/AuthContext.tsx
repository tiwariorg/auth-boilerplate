/**
 * AuthContext.tsx
 *
 * React Context and Provider for application-wide authentication state.
 *
 * Provides:
 *   - `user`            — the currently authenticated User, or null.
 *   - `isAuthenticated` — derived boolean; true when a user is logged in.
 *   - `login`           — async function that delegates to authService and
 *                         updates state on success.
 *   - `logout`          — clears the current user from state.
 *
 * Usage:
 *   Wrap your component tree with <AuthProvider> and consume the context
 *   via the exported `useAuth()` hook.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { AuthContextType, User } from '../types/auth';
import { authenticateUser } from '../services/authService';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * The raw context object. Initialised to `undefined` so that `useAuth` can
 * detect when it is called outside of an `<AuthProvider>` tree.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider
 *
 * Wrap your application (or a subtree) with this component to make
 * authentication state available to all descendant components via `useAuth`.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  // Derived: avoids consumers from computing `user !== null` themselves.
  const isAuthenticated = user !== null;

  /**
   * Attempts to authenticate the supplied credentials.
   *
   * @returns `{ success: true }` on valid credentials, or
   *          `{ success: false, error: string }` on failure.
   */
  const login = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await authenticateUser(email, password);

      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }

      return { success: false, error: result.error };
    },
    [],
  );

  /**
   * Clears the authenticated user, effectively logging the user out.
   */
  const logout = useCallback(() => {
    setUser(null);
  }, []);

  // Memoise the context value so that consumers only re-render when the
  // relevant pieces of state actually change.
  const value = useMemo<AuthContextType>(
    () => ({ user, isAuthenticated, login, logout }),
    [user, isAuthenticated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Custom hook
// ---------------------------------------------------------------------------

/**
 * useAuth
 *
 * Convenience hook for consuming the AuthContext.
 *
 * @throws {Error} When called outside of an `<AuthProvider>` tree.
 *
 * @example
 * const { user, login, logout, isAuthenticated } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;

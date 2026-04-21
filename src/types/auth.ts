/**
 * Represents an authenticated application user.
 */
export interface User {
  email: string;
  name: string;
}

/**
 * Credentials supplied by the user on the login form.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Shape of the authentication context provided to the component tree.
 */
export interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

/**
 * Internal record used by the mock authentication service.
 * Includes the plaintext password that is never exposed to consumers.
 */
export type MockUserRecord = {
  email: string;
  password: string;
  name: string;
};

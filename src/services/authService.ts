/**
 * authService.ts
 *
 * Mock authentication service for KAN-3.
 *
 * This module intentionally mirrors the interface a real API client would
 * expose so that swapping in a production implementation only requires
 * replacing this file — all consumers remain unchanged.
 *
 * The mock user records are kept module-private; only the `User` shape
 * (without the password field) is ever returned to callers.
 */

import type { MockUserRecord, User } from '../types/auth';

/** Simulated network round-trip delay in milliseconds. */
const SIMULATED_DELAY_MS = 500;

/**
 * Private mock data store.
 * In a real implementation this would be replaced by API calls.
 */
const mockUsers: MockUserRecord[] = [
  {
    email: 'user@example.com',
    password: 'password123',
    name: 'Demo User',
  },
];

/**
 * Resolves after `SIMULATED_DELAY_MS` milliseconds to mimic a network call.
 */
const simulateNetworkDelay = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));

/**
 * Authenticates a user against the mock data store.
 *
 * @param email    - The email address supplied by the user.
 * @param password - The plaintext password supplied by the user.
 * @returns A promise that resolves to an object containing:
 *   - `success: true`  and a `user` record (without the password) on match, or
 *   - `success: false` and an `error` message when credentials are invalid.
 *
 * @example
 * const result = await authenticateUser('user@example.com', 'password123');
 * if (result.success) {
 *   console.log('Welcome,', result.user.name);
 * } else {
 *   console.error(result.error);
 * }
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: User; error?: string }> {
  await simulateNetworkDelay();

  const match = mockUsers.find(
    (record) => record.email === email && record.password === password,
  );

  if (match) {
    // Return a User object — deliberately omitting the password field.
    const user: User = {
      email: match.email,
      name: match.name,
    };
    return { success: true, user };
  }

  return { success: false, error: 'Invalid email or password' };
}

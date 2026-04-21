/**
 * authService.test.ts
 *
 * Unit tests for the authenticateUser function defined in authService.ts.
 * Covers valid credentials, credential failures, and edge cases.
 *
 * The simulated network delay is replaced with fake timers so that the suite
 * finishes in milliseconds rather than waiting for real timeouts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authenticateUser } from './authService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The single mock user that exists in the service's data store. */
const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'password123';

// ---------------------------------------------------------------------------
// Setup / teardown — replace setTimeout with Vitest fake timers so the
// SIMULATED_DELAY_MS pause does not slow down the test suite.
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Convenience wrapper: starts the async call, immediately advances all pending
 * timers, then awaits the settled promise.
 */
async function callAuthenticateUser(
  email: string,
  password: string,
): Promise<Awaited<ReturnType<typeof authenticateUser>>> {
  const promise = authenticateUser(email, password);
  await vi.runAllTimersAsync();
  return promise;
}

// ---------------------------------------------------------------------------
// authenticateUser
// ---------------------------------------------------------------------------

describe('authenticateUser', () => {
  // -------------------------------------------------------------------------
  // Return type / async contract
  // -------------------------------------------------------------------------

  describe('async contract', () => {
    it('returns a Promise', () => {
      const result = authenticateUser(VALID_EMAIL, VALID_PASSWORD);

      // Must be thenable before any timers advance
      expect(result).toBeInstanceOf(Promise);

      // Flush timers so the promise settles and doesn't leak into other tests
      vi.runAllTimersAsync();
    });
  });

  // -------------------------------------------------------------------------
  // Valid credentials
  // -------------------------------------------------------------------------

  describe('valid credentials', () => {
    it('resolves with success: true for correct email and password', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, VALID_PASSWORD);

      expect(result.success).toBe(true);
    });

    it('includes a user object in the resolved value', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, VALID_PASSWORD);

      expect(result.user).toBeDefined();
    });

    it('returned user object contains the correct email', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, VALID_PASSWORD);

      expect(result.user?.email).toBe(VALID_EMAIL);
    });

    it('returned user object contains the name field', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, VALID_PASSWORD);

      expect(result.user?.name).toBeDefined();
      expect(typeof result.user?.name).toBe('string');
      expect(result.user?.name.length).toBeGreaterThan(0);
    });

    it('returned user object does NOT contain a password field', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, VALID_PASSWORD);

      // Cast to a loose record so TypeScript lets us probe for the forbidden key
      const userAsRecord = result.user as Record<string, unknown> | undefined;
      expect(userAsRecord).not.toHaveProperty('password');
    });

    it('does not include an error message on success', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, VALID_PASSWORD);

      expect(result.error).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Wrong password
  // -------------------------------------------------------------------------

  describe('wrong password', () => {
    it('resolves with success: false for a correct email but wrong password', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, 'wrongPassword!');

      expect(result.success).toBe(false);
    });

    it('includes an error message when the password is wrong', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, 'wrongPassword!');

      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.error!.length).toBeGreaterThan(0);
    });

    it('does not include a user object when the password is wrong', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, 'wrongPassword!');

      expect(result.user).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Non-existent email
  // -------------------------------------------------------------------------

  describe('non-existent email', () => {
    it('resolves with success: false for an email that does not exist', async () => {
      const result = await callAuthenticateUser(
        'nobody@nowhere.com',
        VALID_PASSWORD,
      );

      expect(result.success).toBe(false);
    });

    it('includes an error message when the email is not found', async () => {
      const result = await callAuthenticateUser(
        'nobody@nowhere.com',
        VALID_PASSWORD,
      );

      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.error!.length).toBeGreaterThan(0);
    });

    it('does not include a user object when the email is not found', async () => {
      const result = await callAuthenticateUser(
        'nobody@nowhere.com',
        VALID_PASSWORD,
      );

      expect(result.user).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Empty credentials
  // -------------------------------------------------------------------------

  describe('empty credentials', () => {
    it('resolves with success: false when both email and password are empty strings', async () => {
      const result = await callAuthenticateUser('', '');

      expect(result.success).toBe(false);
    });

    it('includes an error message when both credentials are empty', async () => {
      const result = await callAuthenticateUser('', '');

      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.error!.length).toBeGreaterThan(0);
    });

    it('resolves with success: false when only the email is empty', async () => {
      const result = await callAuthenticateUser('', VALID_PASSWORD);

      expect(result.success).toBe(false);
    });

    it('resolves with success: false when only the password is empty', async () => {
      const result = await callAuthenticateUser(VALID_EMAIL, '');

      expect(result.success).toBe(false);
    });
  });
});

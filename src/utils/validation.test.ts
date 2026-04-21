/**
 * validation.test.ts
 *
 * Unit tests for the validation utility functions defined in validation.ts.
 * Covers validateEmail, validatePassword, and validateLoginForm.
 */

import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateLoginForm,
  type LoginFormErrors,
} from './validation';

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------

describe('validateEmail', () => {
  describe('invalid inputs — returns an error string', () => {
    it('returns an error for an empty string', () => {
      const result = validateEmail('');
      expect(result).toBe('Email is required');
    });

    it('returns an error for a string with only whitespace', () => {
      const result = validateEmail('   ');
      expect(result).toBe('Email is required');
    });

    it('returns an error for "noatsign" (missing @ and domain)', () => {
      const result = validateEmail('noatsign');
      expect(result).toBe('Invalid email format');
    });

    it('returns an error for "missing@domain" (no TLD after dot)', () => {
      const result = validateEmail('missing@domain');
      expect(result).toBe('Invalid email format');
    });

    it('returns an error for "@nodomain.com" (empty local part)', () => {
      const result = validateEmail('@nodomain.com');
      expect(result).toBe('Invalid email format');
    });
  });

  describe('valid inputs — returns null', () => {
    it('returns null for "user@example.com"', () => {
      const result = validateEmail('user@example.com');
      expect(result).toBeNull();
    });

    it('returns null for "test.user@domain.co"', () => {
      const result = validateEmail('test.user@domain.co');
      expect(result).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// validatePassword
// ---------------------------------------------------------------------------

describe('validatePassword', () => {
  describe('invalid inputs — returns an error string', () => {
    it('returns an error for an empty string', () => {
      const result = validatePassword('');
      expect(result).toBe('Password is required');
    });
  });

  describe('valid inputs — returns null', () => {
    it('returns null for a single character password', () => {
      const result = validatePassword('a');
      expect(result).toBeNull();
    });

    it('returns null for a typical alphanumeric password', () => {
      const result = validatePassword('secret123');
      expect(result).toBeNull();
    });

    it('returns null for a password containing special characters', () => {
      const result = validatePassword('P@$$w0rd!');
      expect(result).toBeNull();
    });

    it('returns null for a password that is only whitespace (non-empty)', () => {
      // validatePassword only checks for empty string; whitespace-only is valid
      const result = validatePassword('   ');
      expect(result).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// validateLoginForm
// ---------------------------------------------------------------------------

describe('validateLoginForm', () => {
  it('returns null when both email and password are valid', () => {
    const result = validateLoginForm('user@example.com', 'secret123');
    expect(result).toBeNull();
  });

  it('returns an object with only an email error when the email is invalid', () => {
    const result = validateLoginForm('noatsign', 'secret123');

    expect(result).not.toBeNull();
    expect((result as LoginFormErrors).email).toBe('Invalid email format');
    expect((result as LoginFormErrors).password).toBeUndefined();
  });

  it('returns an object with only a password error when the password is empty', () => {
    const result = validateLoginForm('user@example.com', '');

    expect(result).not.toBeNull();
    expect((result as LoginFormErrors).password).toBe('Password is required');
    expect((result as LoginFormErrors).email).toBeUndefined();
  });

  it('returns an object with both errors when email is empty and password is empty', () => {
    const result = validateLoginForm('', '');

    expect(result).not.toBeNull();
    expect((result as LoginFormErrors).email).toBe('Email is required');
    expect((result as LoginFormErrors).password).toBe('Password is required');
  });

  it('returns an object with both errors when email format is invalid and password is empty', () => {
    const result = validateLoginForm('bad-email', '');

    expect(result).not.toBeNull();
    expect((result as LoginFormErrors).email).toBe('Invalid email format');
    expect((result as LoginFormErrors).password).toBe('Password is required');
  });
});

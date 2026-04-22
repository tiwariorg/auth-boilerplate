/**
 * UserInfo.test.tsx
 *
 * Component tests for the UserInfo presentational component.
 *
 * Covers:
 *  - Rendering of the card container, heading, and email
 *  - Correct interpolation of user.name and user.email props
 *  - Accessibility: semantic heading level, labelled email text
 *  - Edge cases: long values, special characters, minimum-length values
 *  - Prop isolation: changing the user prop updates the rendered output
 *  - No side-effects: component renders without errors and without
 *    requiring any context providers
 *
 * Ticket: KAN-4
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { UserInfo } from './UserInfo'
import type { User } from '../../types/auth'

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const DEMO_USER: User = {
  email: 'user@example.com',
  name: 'Demo User',
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Renders UserInfo with the supplied user prop (defaults to DEMO_USER). */
function setup(user: User = DEMO_USER) {
  return render(<UserInfo user={user} />)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UserInfo', () => {
  // ── Card container ────────────────────────────────────────────────────────

  describe('card container', () => {
    it('renders the card wrapper element with the correct data-testid', () => {
      setup()
      expect(screen.getByTestId('user-info-card')).toBeInTheDocument()
    })

    it('renders exactly one card element', () => {
      setup()
      const cards = screen.getAllByTestId('user-info-card')
      expect(cards).toHaveLength(1)
    })
  })

  // ── Welcome heading ───────────────────────────────────────────────────────

  describe('welcome heading', () => {
    it('renders a heading element', () => {
      setup()
      // h2 is implicitly accessible as a "heading" role
      const heading = screen.getByRole('heading', { name: /welcome/i })
      expect(heading).toBeInTheDocument()
    })

    it('renders the heading as an <h2>', () => {
      setup()
      const heading = screen.getByRole('heading', { name: /welcome/i })
      expect(heading.tagName).toBe('H2')
    })

    it("includes the user's name in the heading text", () => {
      setup()
      expect(
        screen.getByRole('heading', { name: `Welcome, ${DEMO_USER.name}!` }),
      ).toBeInTheDocument()
    })

    it('includes the exclamation mark after the name', () => {
      setup()
      const heading = screen.getByRole('heading', { name: /welcome/i })
      expect(heading.textContent).toBe(`Welcome, ${DEMO_USER.name}!`)
    })
  })

  // ── Email display ─────────────────────────────────────────────────────────

  describe('email display', () => {
    it("renders the user's email address", () => {
      setup()
      expect(screen.getByText(DEMO_USER.email)).toBeInTheDocument()
    })

    it('renders the "Email:" label text', () => {
      setup()
      // The paragraph contains "Email:" as a text node before the <span>
      const card = screen.getByTestId('user-info-card')
      expect(card.textContent).toContain('Email:')
    })

    it('renders the email inside the card container', () => {
      setup()
      const card = screen.getByTestId('user-info-card')
      expect(card).toHaveTextContent(DEMO_USER.email)
    })
  })

  // ── Prop interpolation ────────────────────────────────────────────────────

  describe('prop interpolation', () => {
    it('displays a different name when user.name changes', () => {
      const user: User = { email: 'alice@example.com', name: 'Alice' }
      setup(user)
      expect(
        screen.getByRole('heading', { name: 'Welcome, Alice!' }),
      ).toBeInTheDocument()
    })

    it('displays a different email when user.email changes', () => {
      const user: User = { email: 'alice@example.com', name: 'Alice' }
      setup(user)
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    })

    it('does not show the wrong name when given a different user', () => {
      const user: User = { email: 'bob@example.com', name: 'Bob' }
      setup(user)
      expect(
        screen.queryByRole('heading', { name: `Welcome, ${DEMO_USER.name}!` }),
      ).not.toBeInTheDocument()
    })

    it('does not show the wrong email when given a different user', () => {
      const user: User = { email: 'bob@example.com', name: 'Bob' }
      setup(user)
      expect(screen.queryByText(DEMO_USER.email)).not.toBeInTheDocument()
    })
  })

  // ── Re-render with new props ──────────────────────────────────────────────

  describe('re-render with updated props', () => {
    it('updates the heading when user prop is replaced via rerender', () => {
      const { rerender } = setup(DEMO_USER)

      expect(
        screen.getByRole('heading', { name: `Welcome, ${DEMO_USER.name}!` }),
      ).toBeInTheDocument()

      const newUser: User = { email: 'carol@example.com', name: 'Carol' }
      rerender(<UserInfo user={newUser} />)

      expect(
        screen.getByRole('heading', { name: 'Welcome, Carol!' }),
      ).toBeInTheDocument()
    })

    it('updates the email when user prop is replaced via rerender', () => {
      const { rerender } = setup(DEMO_USER)

      expect(screen.getByText(DEMO_USER.email)).toBeInTheDocument()

      const newUser: User = { email: 'carol@example.com', name: 'Carol' }
      rerender(<UserInfo user={newUser} />)

      expect(screen.getByText('carol@example.com')).toBeInTheDocument()
      expect(screen.queryByText(DEMO_USER.email)).not.toBeInTheDocument()
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('renders correctly when name contains special characters', () => {
      const user: User = { email: 'user@example.com', name: "O'Brien-Smith" }
      setup(user)
      expect(
        screen.getByRole('heading', { name: "Welcome, O'Brien-Smith!" }),
      ).toBeInTheDocument()
    })

    it('renders correctly when email contains plus-addressing', () => {
      const user: User = { email: 'user+tag@example.com', name: 'Tagged User' }
      setup(user)
      expect(screen.getByText('user+tag@example.com')).toBeInTheDocument()
    })

    it('renders correctly when name is a single character', () => {
      const user: User = { email: 'x@example.com', name: 'X' }
      setup(user)
      expect(
        screen.getByRole('heading', { name: 'Welcome, X!' }),
      ).toBeInTheDocument()
    })

    it('renders correctly when name is very long', () => {
      const longName = 'A'.repeat(100)
      const user: User = { email: 'long@example.com', name: longName }
      setup(user)
      const heading = screen.getByRole('heading', { name: /welcome/i })
      expect(heading.textContent).toBe(`Welcome, ${longName}!`)
    })

    it('renders correctly when email is a subdomain address', () => {
      const user: User = { email: 'user@mail.company.co.uk', name: 'UK User' }
      setup(user)
      expect(screen.getByText('user@mail.company.co.uk')).toBeInTheDocument()
    })

    it('renders without throwing when given the minimum valid User shape', () => {
      const user: User = { email: 'a@b.co', name: 'A' }
      expect(() => setup(user)).not.toThrow()
    })
  })

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('heading is accessible by its role', () => {
      setup()
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    it('heading is at level 2', () => {
      setup()
      expect(
        screen.getByRole('heading', { level: 2 }),
      ).toBeInTheDocument()
    })

    it('the card element is a <div> (landmark-neutral, non-interactive)', () => {
      setup()
      const card = screen.getByTestId('user-info-card')
      expect(card.tagName).toBe('DIV')
    })

    it('the full card text content contains both name and email', () => {
      setup()
      const card = screen.getByTestId('user-info-card')
      expect(card.textContent).toContain(DEMO_USER.name)
      expect(card.textContent).toContain(DEMO_USER.email)
    })
  })

  // ── Stateless / no-provider requirement ──────────────────────────────────

  describe('stateless rendering', () => {
    it('renders without any context provider', () => {
      // UserInfo should be purely presentational — no context dependency
      expect(() => setup()).not.toThrow()
    })

    it('renders the same output on repeated calls with the same props', () => {
      const { container: c1 } = render(<UserInfo user={DEMO_USER} />)
      const { container: c2 } = render(<UserInfo user={DEMO_USER} />)
      expect(c1.innerHTML).toBe(c2.innerHTML)
    })
  })
})

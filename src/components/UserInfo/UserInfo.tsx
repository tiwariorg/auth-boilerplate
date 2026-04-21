/**
 * UserInfo.tsx
 *
 * A pure presentational component that renders a card displaying the
 * authenticated user's name and email address.
 * No internal state or event handlers.
 *
 * Ticket: KAN-3
 */

import type { User } from '../../types/auth';
import styles from './UserInfo.module.css';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface UserInfoProps {
  /** The authenticated user whose information is displayed. */
  user: User;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * UserInfo
 *
 * Renders a card-like container with a welcome heading and the user's email.
 * It is intentionally stateless and side-effect-free.
 */
export function UserInfo({ user }: UserInfoProps) {
  return (
    <div className={styles.card} data-testid="user-info-card">
      <h2 className={styles.heading}>Welcome, {user.name}!</h2>
      <p className={styles.email}>
        Email:{' '}
        <span className={styles.emailValue}>{user.email}</span>
      </p>
    </div>
  );
}

export default UserInfo;

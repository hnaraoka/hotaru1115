export type SessionCheckUser = { isActive: boolean; passwordChangedAt: Date };

/**
 * A logged-in session (JWT) stays valid only if the account is still active
 * AND the password hasn't been changed/reset since the session was issued.
 * Without the second check, resetting a compromised user's password would
 * not actually log out an attacker who was already using that session.
 */
export function isSessionStillValid(user: SessionCheckUser, authenticatedAt: number): boolean {
  return user.isActive && user.passwordChangedAt.getTime() <= authenticatedAt;
}

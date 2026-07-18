export const MAX_FAILED_LOGIN_ATTEMPTS = 3;
export const LOGIN_LOCKOUT_MINUTES = 15;

// How often an existing session re-confirms the account is still active
// (isActive) and hasn't had its role changed, so that disabling an account
// takes effect quickly instead of waiting for the ~30-day JWT session to
// expire on its own.
export const SESSION_ACTIVE_RECHECK_MINUTES = 5;

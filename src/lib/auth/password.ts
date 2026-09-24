// Shared password/username rules for account creation, password reset,
// and self-service password change — kept in one place so every entry
// point enforces the exact same policy.

export function validatePassword(password: string, confirmPassword: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include both letters and numbers.";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]{3,30}$/;

export function validateUsername(username: string): string | null {
  if (!USERNAME_PATTERN.test(username)) {
    return "Username must be 3-30 characters — letters, numbers, dots, or underscores only.";
  }
  return null;
}

// Staff log in with a username, not an email, but Supabase Auth requires
// an email-shaped identifier under the hood. This derives a stable,
// never-emailed synthetic address from the username so login can be
// resolved without a pre-auth database lookup: given a typed username,
// the login action can compute the exact same address and just try it.
const STAFF_EMAIL_DOMAIN = "staff.chamkani.internal";

export function usernameToStaffEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
}

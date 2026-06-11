/**
 * Client-side field validation for the auth forms. Native HTML5 validation
 * bubbles are suppressed (`noValidate` on the forms) in favour of inline
 * messages styled to the design system, so these pure functions are the
 * single source of the rules the inline messages enforce.
 */

/** Better Auth's default minimum password length. */
export const PASSWORD_MIN_LENGTH = 8;

/**
 * Pragmatic email shape check (something@something.tld). The server remains
 * the real authority — this only exists to give friendly inline feedback.
 */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

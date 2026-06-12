/**
 * Validation for the compulsory "how do we know each other?" message that
 * every sign-up must provide (anti-spam gate — the admin reads it before
 * approving the account). Pure functions, unit-tested; enforced client-side in
 * SignUpForm and server-side in the Better Auth hooks (src/lib/auth.ts).
 */

export const INTRODUCTION_MIN_LENGTH = 10;
export const INTRODUCTION_MAX_LENGTH = 1000;

/**
 * Google sign-ups can't send form fields in a request body — the user row is
 * created server-side during the OAuth callback. SignUpForm's Google mode
 * stashes the (URI-encoded) values in these short-lived cookies before
 * redirecting to Google; the user-create database hook reads them back and
 * stores them on the row. The name cookie lets the user choose their display
 * name instead of inheriting the Google profile name.
 */
export const INTRODUCTION_COOKIE = "google_signup_introduction";
export const GOOGLE_NAME_COOKIE = "google_signup_name";
export const INTRODUCTION_COOKIE_MAX_AGE = 10 * 60; // seconds

export const GOOGLE_NAME_MAX_LENGTH = 100;

/** Trimmed value that gets validated and stored. */
export function normalizeIntroduction(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidIntroduction(value: unknown): boolean {
  const normalized = normalizeIntroduction(value);
  return (
    normalized.length >= INTRODUCTION_MIN_LENGTH &&
    normalized.length <= INTRODUCTION_MAX_LENGTH
  );
}

/** Decode + normalize the URI-encoded INTRODUCTION_COOKIE value. */
export function introductionFromCookie(
  raw: string | null | undefined,
): string {
  if (!raw) return "";
  try {
    return normalizeIntroduction(decodeURIComponent(raw));
  } catch {
    // Malformed %-sequence (cookie tampered/truncated) — treat as absent.
    return "";
  }
}

/**
 * Decode the URI-encoded GOOGLE_NAME_COOKIE value. Empty string means
 * "absent" — the hook then keeps the Google profile name instead.
 */
export function nameFromCookie(raw: string | null | undefined): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).trim().slice(0, GOOGLE_NAME_MAX_LENGTH);
  } catch {
    return "";
  }
}

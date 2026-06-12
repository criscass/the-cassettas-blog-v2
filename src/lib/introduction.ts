/**
 * Validation for the compulsory "how do we know each other?" message that
 * every sign-up must provide (anti-spam gate — the admin reads it before
 * approving the account). Pure functions, unit-tested; enforced client-side in
 * SignUpForm and server-side in the Better Auth hooks (src/lib/auth.ts).
 */

export const INTRODUCTION_MIN_LENGTH = 10;
export const INTRODUCTION_MAX_LENGTH = 1000;

/**
 * Google sign-ups can't send the introduction in a request body — the user row
 * is created server-side during the OAuth callback. SignUpForm stashes the
 * (URI-encoded) value in this short-lived cookie before redirecting to Google;
 * the user-create database hook reads it back and stores it on the row.
 */
export const INTRODUCTION_COOKIE = "google_signup_introduction";
export const INTRODUCTION_COOKIE_MAX_AGE = 10 * 60; // seconds

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

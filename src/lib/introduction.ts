/**
 * Validation for the compulsory "how do we know each other?" message that
 * email sign-ups must provide (anti-spam gate — the admin reads it before
 * approving the account). Pure functions, unit-tested; enforced client-side in
 * SignUpForm and server-side in the Better Auth before-hook (src/lib/auth.ts).
 */

export const INTRODUCTION_MIN_LENGTH = 10;
export const INTRODUCTION_MAX_LENGTH = 1000;

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

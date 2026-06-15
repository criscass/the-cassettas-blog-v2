/**
 * Pure contact-form rules — validation and the honeypot check — extracted so
 * they're unit-testable without a network or Astro request context (mirrors
 * src/lib/comments.ts). The /api/contact endpoint composes these.
 */

export const CONTACT_NAME_MAX_LENGTH = 100;
export const CONTACT_EMAIL_MAX_LENGTH = 254;
export const CONTACT_MESSAGE_MAX_LENGTH = 4000;

/** Name of the hidden field bots tend to fill in (see ContactForm). */
export const HONEYPOT_FIELD = "website";

// Deliberately loose — enough to reject obvious non-addresses without rejecting
// valid-but-unusual ones. Real verification would mean sending mail anyway.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactInput = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

export type ValidatedContact = {
  name: string;
  email: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; value: ValidatedContact }
  | { ok: false; error: string };

/**
 * Validate and normalize a contact-form payload. Trims each field and enforces
 * non-empty values within their length caps, plus a basic email shape.
 */
export function validateContactInput(input: ContactInput): ValidationResult {
  const { name, email, message } = input;

  if (typeof name !== "string" || name.trim() === "") {
    return { ok: false, error: "Name is required" };
  }
  const trimmedName = name.trim();
  if (trimmedName.length > CONTACT_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Name must be ${CONTACT_NAME_MAX_LENGTH} characters or fewer`,
    };
  }

  if (typeof email !== "string" || email.trim() === "") {
    return { ok: false, error: "Email is required" };
  }
  const trimmedEmail = email.trim();
  if (trimmedEmail.length > CONTACT_EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(trimmedEmail)) {
    return { ok: false, error: "Please enter a valid email address" };
  }

  if (typeof message !== "string" || message.trim() === "") {
    return { ok: false, error: "Message is required" };
  }
  const trimmedMessage = message.trim();
  if (trimmedMessage.length > CONTACT_MESSAGE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Message must be ${CONTACT_MESSAGE_MAX_LENGTH} characters or fewer`,
    };
  }

  return {
    ok: true,
    value: { name: trimmedName, email: trimmedEmail, message: trimmedMessage },
  };
}

/**
 * True when the hidden honeypot field carries a value — a real browser leaves
 * it empty, so any content signals a bot. Stays defensive about field type.
 */
export function isHoneypotTripped(body: Record<string, unknown>): boolean {
  const value = body[HONEYPOT_FIELD];
  return typeof value === "string" && value.trim() !== "";
}

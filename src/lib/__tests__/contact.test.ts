import { describe, it, expect } from "vitest";
import {
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_NAME_MAX_LENGTH,
  HONEYPOT_FIELD,
  isHoneypotTripped,
  validateContactInput,
} from "@lib/contact";
import { contactFormEmail } from "@lib/notifications";

describe("validateContactInput", () => {
  const valid = {
    name: "  Maria Rossi  ",
    email: "  maria@example.com ",
    message: "  Hello there!  ",
  };

  it("accepts valid input and returns trimmed values", () => {
    const result = validateContactInput(valid);
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Maria Rossi",
        email: "maria@example.com",
        message: "Hello there!",
      },
    });
  });

  it("rejects an empty name", () => {
    const result = validateContactInput({ ...valid, name: "   " });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-length name", () => {
    const result = validateContactInput({
      ...valid,
      name: "x".repeat(CONTACT_NAME_MAX_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing email", () => {
    const result = validateContactInput({ ...valid, email: "" });
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = validateContactInput({ ...valid, email: "not-an-email" });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty message", () => {
    const result = validateContactInput({ ...valid, message: "   " });
    expect(result.ok).toBe(false);
  });

  it("rejects an over-length message", () => {
    const result = validateContactInput({
      ...valid,
      message: "x".repeat(CONTACT_MESSAGE_MAX_LENGTH + 1),
    });
    expect(result.ok).toBe(false);
  });
});

describe("isHoneypotTripped", () => {
  it("is true when the honeypot field is filled", () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "http://spam" })).toBe(true);
  });

  it("is false when the honeypot field is empty or absent", () => {
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "" })).toBe(false);
    expect(isHoneypotTripped({ [HONEYPOT_FIELD]: "   " })).toBe(false);
    expect(isHoneypotTripped({})).toBe(false);
  });
});

describe("contactFormEmail", () => {
  const input = {
    name: "Maria Rossi",
    email: "maria@example.com",
    message: "I loved this post!",
  };

  it("includes the name in the subject and the details in the body", () => {
    const email = contactFormEmail(input);
    expect(email.subject).toContain("Maria Rossi");
    expect(email.text).toContain("Maria Rossi");
    expect(email.text).toContain("maria@example.com");
    expect(email.text).toContain("I loved this post!");
  });

  it("sets Reply-To to the sender's email", () => {
    expect(contactFormEmail(input).replyTo).toBe("maria@example.com");
  });
});

import { describe, expect, it } from "vitest";
import { isValidEmail, PASSWORD_MIN_LENGTH } from "../form-validation";

describe("isValidEmail", () => {
  it("accepts a plain address", () => {
    expect(isValidEmail("maria@example.com")).toBe(true);
  });

  it("accepts subdomains and plus-addressing", () => {
    expect(isValidEmail("maria+blog@mail.example.co.uk")).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(isValidEmail("  maria@example.com  ")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects a missing @", () => {
    expect(isValidEmail("maria.example.com")).toBe(false);
  });

  it("rejects a missing domain dot", () => {
    expect(isValidEmail("maria@example")).toBe(false);
  });

  it("rejects inner whitespace", () => {
    expect(isValidEmail("maria @example.com")).toBe(false);
  });
});

describe("PASSWORD_MIN_LENGTH", () => {
  it("matches Better Auth's default of 8", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });
});

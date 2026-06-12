import { describe, it, expect } from "vitest";
import {
  INTRODUCTION_MAX_LENGTH,
  INTRODUCTION_MIN_LENGTH,
  introductionFromCookie,
  isValidIntroduction,
  normalizeIntroduction,
} from "@lib/introduction";

describe("normalizeIntroduction", () => {
  it("trims whitespace", () => {
    expect(normalizeIntroduction("  ciao a tutti  ")).toBe("ciao a tutti");
  });

  it("returns an empty string for non-string input", () => {
    expect(normalizeIntroduction(undefined)).toBe("");
    expect(normalizeIntroduction(null)).toBe("");
    expect(normalizeIntroduction(42)).toBe("");
  });
});

describe("isValidIntroduction", () => {
  it("accepts a normal introduction", () => {
    expect(isValidIntroduction("Sono la cugina di Luca!")).toBe(true);
  });

  it("rejects missing or empty values", () => {
    expect(isValidIntroduction(undefined)).toBe(false);
    expect(isValidIntroduction("")).toBe(false);
  });

  it("rejects values shorter than the minimum once trimmed", () => {
    const padded = `  ${"x".repeat(INTRODUCTION_MIN_LENGTH - 1)}  `;
    expect(isValidIntroduction(padded)).toBe(false);
    expect(isValidIntroduction("x".repeat(INTRODUCTION_MIN_LENGTH))).toBe(true);
  });

  it("rejects values over the maximum length", () => {
    expect(isValidIntroduction("x".repeat(INTRODUCTION_MAX_LENGTH + 1))).toBe(
      false,
    );
    expect(isValidIntroduction("x".repeat(INTRODUCTION_MAX_LENGTH))).toBe(true);
  });
});

describe("introductionFromCookie", () => {
  it("decodes the URI-encoded value and trims it", () => {
    const raw = encodeURIComponent("  Sono la cugina di Luca!  ");
    expect(introductionFromCookie(raw)).toBe("Sono la cugina di Luca!");
  });

  it("returns an empty string for a missing cookie", () => {
    expect(introductionFromCookie(null)).toBe("");
    expect(introductionFromCookie(undefined)).toBe("");
    expect(introductionFromCookie("")).toBe("");
  });

  it("returns an empty string for a malformed %-sequence", () => {
    expect(introductionFromCookie("ciao%E0%A4%A")).toBe("");
  });
});

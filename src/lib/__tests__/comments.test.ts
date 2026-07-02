import { describe, it, expect } from "vitest";
import {
  canUserComment,
  COMMENT_MAX_LENGTH,
  isSupportedLanguage,
  POST_ID_MAX_LENGTH,
  validateCommentInput,
} from "@lib/comments";

describe("isSupportedLanguage", () => {
  it("accepts it and en", () => {
    expect(isSupportedLanguage("it")).toBe(true);
    expect(isSupportedLanguage("en")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isSupportedLanguage("fr")).toBe(false);
    expect(isSupportedLanguage("")).toBe(false);
    expect(isSupportedLanguage(null)).toBe(false);
    expect(isSupportedLanguage(undefined)).toBe(false);
  });
});

describe("canUserComment", () => {
  it("allows approved users", () => {
    expect(canUserComment({ status: "approved" })).toBe(true);
  });

  it("blocks pending/rejected/unknown users", () => {
    expect(canUserComment({ status: "pending" })).toBe(false);
    expect(canUserComment({ status: "rejected" })).toBe(false);
    expect(canUserComment({ status: undefined })).toBe(false);
  });

  it("blocks anonymous (no user)", () => {
    expect(canUserComment(null)).toBe(false);
    expect(canUserComment(undefined)).toBe(false);
  });
});

describe("validateCommentInput", () => {
  const valid = { postId: "post-00042", language: "it", content: "Ciao!" };

  it("accepts a well-formed payload and trims content", () => {
    const result = validateCommentInput({ ...valid, content: "  hi  " });
    expect(result).toEqual({
      ok: true,
      value: { postId: "post-00042", language: "it", content: "hi" },
    });
  });

  it("rejects a missing/blank postId", () => {
    expect(validateCommentInput({ ...valid, postId: "" }).ok).toBe(false);
    expect(validateCommentInput({ ...valid, postId: undefined }).ok).toBe(false);
  });

  it("rejects a postId with an invalid charset or over the length cap", () => {
    expect(validateCommentInput({ ...valid, postId: "post-00042/../x" }).ok).toBe(false);
    expect(validateCommentInput({ ...valid, postId: "POST-00042" }).ok).toBe(false);
    expect(validateCommentInput({ ...valid, postId: "post 00042" }).ok).toBe(false);
    expect(
      validateCommentInput({ ...valid, postId: `post-${"0".repeat(POST_ID_MAX_LENGTH)}` }).ok,
    ).toBe(false);
  });

  it("rejects an unsupported language", () => {
    const result = validateCommentInput({ ...valid, language: "fr" });
    expect(result).toEqual({ ok: false, error: "Invalid language" });
  });

  it("rejects empty/whitespace-only content", () => {
    expect(validateCommentInput({ ...valid, content: "   " }).ok).toBe(false);
    expect(validateCommentInput({ ...valid, content: 123 }).ok).toBe(false);
  });

  it("rejects content over the length cap", () => {
    const tooLong = "a".repeat(COMMENT_MAX_LENGTH + 1);
    const result = validateCommentInput({ ...valid, content: tooLong });
    expect(result.ok).toBe(false);
  });

  it("accepts content exactly at the length cap", () => {
    const atCap = "a".repeat(COMMENT_MAX_LENGTH);
    expect(validateCommentInput({ ...valid, content: atCap }).ok).toBe(true);
  });
});

import { requiresApproval } from "@lib/auth-approval";

/**
 * Pure comment rules — validation and the write-authorization predicate —
 * extracted so they're unit-testable without a database or Astro request
 * context (mirrors the approach in src/lib/auth-approval.ts). The
 * /api/comments endpoint composes these.
 */

export const COMMENT_MAX_LENGTH = 2000;
export const SUPPORTED_LANGUAGES = ["it", "en"] as const;
export type CommentLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(
  value: string | null | undefined,
): value is CommentLanguage {
  return value === "it" || value === "en";
}

/** A signed-in user may comment only once their account is `approved`. */
export function canUserComment(
  user: { status?: string | null } | null | undefined,
): boolean {
  if (!user) return false;
  return !requiresApproval(user.status);
}

export type CommentInput = {
  postId?: unknown;
  language?: unknown;
  content?: unknown;
};

export type ValidatedComment = {
  postId: string;
  language: CommentLanguage;
  content: string;
};

export type ValidationResult =
  | { ok: true; value: ValidatedComment }
  | { ok: false; error: string };

/**
 * Validate and normalize a comment write payload. Trims content, enforces a
 * non-empty body within the length cap, and checks the post/language fields.
 */
export function validateCommentInput(input: CommentInput): ValidationResult {
  const { postId, language, content } = input;

  if (typeof postId !== "string" || postId.trim() === "") {
    return { ok: false, error: "Missing postId" };
  }
  if (typeof language !== "string" || !isSupportedLanguage(language)) {
    return { ok: false, error: "Invalid language" };
  }
  if (typeof content !== "string") {
    return { ok: false, error: "Missing content" };
  }

  const trimmed = content.trim();
  if (trimmed === "") {
    return { ok: false, error: "Comment cannot be empty" };
  }
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return {
      ok: false,
      error: `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer`,
    };
  }

  return {
    ok: true,
    value: { postId: postId.trim(), language, content: trimmed },
  };
}

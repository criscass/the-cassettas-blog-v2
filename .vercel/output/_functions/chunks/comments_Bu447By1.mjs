import { r as requiresApproval } from './auth-approval_D-FgCjcG.mjs';

const COMMENT_MAX_LENGTH = 2e3;
function isSupportedLanguage(value) {
  return value === "it" || value === "en";
}
function canUserComment(user) {
  if (!user) return false;
  return !requiresApproval(user.status);
}
function validateCommentInput(input) {
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
      error: `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer`
    };
  }
  return {
    ok: true,
    value: { postId: postId.trim(), language, content: trimmed }
  };
}

export { COMMENT_MAX_LENGTH as C, canUserComment as c, isSupportedLanguage as i, validateCommentInput as v };

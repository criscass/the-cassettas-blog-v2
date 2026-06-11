import { describe, it, expect } from "vitest";
import {
  COMMENT_EXCERPT_MAX_LENGTH,
  newCommentEmail,
  newPendingUserEmail,
} from "@lib/notifications";

describe("newPendingUserEmail", () => {
  it("includes the user's name and email", () => {
    const email = newPendingUserEmail({
      name: "Maria Rossi",
      email: "maria@example.com",
    });
    expect(email.subject).toContain("Maria Rossi");
    expect(email.text).toContain("maria@example.com");
  });

  it("links to the approval queue when a base URL is given", () => {
    const email = newPendingUserEmail(
      { name: "Maria Rossi", email: "maria@example.com" },
      "https://example.com",
    );
    expect(email.text).toContain("https://example.com/admin/users");
  });

  it("omits the link without a base URL", () => {
    const email = newPendingUserEmail({
      name: "Maria Rossi",
      email: "maria@example.com",
    });
    expect(email.text).not.toContain("/admin/users");
  });
});

describe("newCommentEmail", () => {
  const input = {
    authorName: "Maria Rossi",
    postId: "post-00042",
    language: "it",
    content: "Bellissimo post!",
  };

  it("includes author, post and content", () => {
    const email = newCommentEmail(input);
    expect(email.subject).toContain("Maria Rossi");
    expect(email.subject).toContain("post-00042");
    expect(email.text).toContain("Bellissimo post!");
  });

  it("links to the post when a base URL is given", () => {
    const email = newCommentEmail(input, "https://example.com");
    expect(email.text).toContain("https://example.com/it/post-00042");
  });

  it("truncates long comments to the excerpt limit", () => {
    const email = newCommentEmail({
      ...input,
      content: "x".repeat(COMMENT_EXCERPT_MAX_LENGTH + 100),
    });
    expect(email.text).toContain(`${"x".repeat(COMMENT_EXCERPT_MAX_LENGTH)}…`);
    expect(email.text).not.toContain("x".repeat(COMMENT_EXCERPT_MAX_LENGTH + 1));
  });
});

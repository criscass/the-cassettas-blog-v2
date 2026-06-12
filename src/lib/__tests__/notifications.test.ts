import { describe, it, expect } from "vitest";
import {
  accountApprovedEmail,
  COMMENT_EXCERPT_MAX_LENGTH,
  newCommentEmail,
  newPendingUserEmail,
  verificationEmail,
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

  it("includes the sign-up introduction when present", () => {
    const email = newPendingUserEmail({
      name: "Maria Rossi",
      email: "maria@example.com",
      introduction: "Sono la cugina di Luca!",
    });
    expect(email.text).toContain("Sono la cugina di Luca!");
  });

  it("omits the introduction section for Google sign-ups", () => {
    const email = newPendingUserEmail({
      name: "Maria Rossi",
      email: "maria@example.com",
      introduction: null,
    });
    expect(email.text).not.toContain("introduction");
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

describe("verificationEmail", () => {
  const url = "https://example.com/api/auth/verify-email?token=abc";

  it("addresses the user and includes the verification link", () => {
    const email = verificationEmail({ name: "Maria Rossi" }, url);
    expect(email.text).toContain("Maria Rossi");
    expect(email.text).toContain(url);
  });

  it("is bilingual: Italian and English in one message", () => {
    const email = verificationEmail({ name: "Maria Rossi" }, url);
    expect(email.text.toLowerCase()).toContain("conferma il tuo indirizzo");
    expect(email.text.toLowerCase()).toContain("confirm your email address");
    expect(email.subject.toLowerCase()).toContain("verifica");
    expect(email.subject.toLowerCase()).toContain("verify");
  });

  it("mentions that admin approval is still required", () => {
    const email = verificationEmail({ name: "Maria Rossi" }, url);
    expect(email.text).toContain("approvazione");
    expect(email.text).toContain("admin approval");
  });
});

describe("accountApprovedEmail", () => {
  it("addresses the user", () => {
    const email = accountApprovedEmail({ name: "Maria Rossi" });
    expect(email.text).toContain("Maria Rossi");
  });

  it("is bilingual: Italian and English in one message", () => {
    const email = accountApprovedEmail({ name: "Maria Rossi" });
    expect(email.text).toContain("è stato approvato");
    expect(email.text).toContain("has been approved");
    expect(email.subject).toContain("approvato");
    expect(email.subject.toLowerCase()).toContain("approved");
  });

  it("links to both sign-in pages when a base URL is given", () => {
    const email = accountApprovedEmail(
      { name: "Maria Rossi" },
      "https://example.com",
    );
    expect(email.text).toContain("https://example.com/it/sign-in");
    expect(email.text).toContain("https://example.com/en/sign-in");
  });

  it("omits the links without a base URL", () => {
    const email = accountApprovedEmail({ name: "Maria Rossi" });
    expect(email.text).not.toContain("/sign-in");
  });
});

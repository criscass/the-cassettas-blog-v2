/**
 * Admin email notifications, sent through the Resend HTTP API
 * (https://resend.com) with a plain fetch — no SDK dependency.
 *
 * The email builders are pure functions (unit-tested without network or env),
 * mirroring src/lib/comments.ts / src/lib/admin.ts. `sendAdminNotification`
 * is the only side-effecting piece: it no-ops when RESEND_API_KEY or
 * NOTIFY_EMAIL_TO is unset and never throws, so a notification failure can
 * never break sign-up or comment posting.
 */

const env = (key: string): string | undefined =>
  import.meta.env?.[key] ?? process.env[key];

export type NotificationEmail = {
  subject: string;
  text: string;
};

export const COMMENT_EXCERPT_MAX_LENGTH = 300;

/** Email sent when a fresh sign-up lands in the approval queue. */
export function newPendingUserEmail(
  newUser: { name: string; email: string },
  baseUrl?: string,
): NotificationEmail {
  const approveLink = baseUrl ? `\n\nApprove or reject: ${baseUrl}/admin/users` : "";
  return {
    subject: `New user awaiting approval: ${newUser.name}`,
    text: `${newUser.name} (${newUser.email}) signed up and is waiting for approval.${approveLink}`,
  };
}

/** Email sent when an approved user posts a comment. */
export function newCommentEmail(
  input: {
    authorName: string;
    postId: string;
    language: string;
    content: string;
  },
  baseUrl?: string,
): NotificationEmail {
  const excerpt =
    input.content.length > COMMENT_EXCERPT_MAX_LENGTH
      ? `${input.content.slice(0, COMMENT_EXCERPT_MAX_LENGTH)}…`
      : input.content;
  const postLink = baseUrl
    ? `\n\nRead it: ${baseUrl}/${input.language}/${input.postId}`
    : "";
  return {
    subject: `New comment by ${input.authorName} on ${input.postId} (${input.language})`,
    text: `${input.authorName} commented on ${input.postId} (${input.language}):\n\n${excerpt}${postLink}`,
  };
}

/**
 * Deliver a notification to the admin inbox. Returns true only when Resend
 * accepted the email; false when notifications are unconfigured or the send
 * failed (logged, never thrown).
 */
export async function sendAdminNotification(
  email: NotificationEmail,
): Promise<boolean> {
  const apiKey = env("RESEND_API_KEY");
  const to = env("NOTIFY_EMAIL_TO");
  if (!apiKey || !to) return false;

  // Resend's shared test sender; deliverable only to the Resend account owner,
  // which is exactly this use case. Set NOTIFY_EMAIL_FROM to a verified-domain
  // address to move past it.
  const from =
    env("NOTIFY_EMAIL_FROM") ?? "The Cassettas Blog <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject: email.subject, text: email.text }),
    });
    if (!res.ok) {
      console.error(
        `[notifications] Resend responded ${res.status}: ${await res.text()}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("[notifications] failed to send email:", error);
    return false;
  }
}

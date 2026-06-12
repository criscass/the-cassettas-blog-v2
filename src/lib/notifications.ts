/**
 * Transactional email, sent through the Resend HTTP API
 * (https://resend.com) with a plain fetch — no SDK dependency. Covers admin
 * notifications and the user-facing email-verification message.
 *
 * The email builders are pure functions (unit-tested without network or env),
 * mirroring src/lib/comments.ts / src/lib/admin.ts. `sendEmail` is the only
 * side-effecting piece: it no-ops when RESEND_API_KEY is unset and never
 * throws, so an email failure can never break sign-up or comment posting.
 *
 * NOTE: the default `onboarding@resend.dev` sender only delivers to the
 * Resend account owner. User-facing mail (the verification email) needs
 * NOTIFY_EMAIL_FROM set to a verified-domain address.
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
  newUser: { name: string; email: string; introduction?: string | null },
  baseUrl?: string,
): NotificationEmail {
  const approveLink = baseUrl ? `\n\nApprove or reject: ${baseUrl}/admin/users` : "";
  // Email sign-ups always carry an introduction; Google sign-ups don't.
  const introduction = newUser.introduction
    ? `\n\nTheir introduction:\n${newUser.introduction}`
    : "";
  return {
    subject: `New user awaiting approval: ${newUser.name}`,
    text: `${newUser.name} (${newUser.email}) signed up and is waiting for approval.${introduction}${approveLink}`,
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
 * Email sent to a fresh email/password sign-up so they can verify their
 * address. Bilingual (IT first, EN below) because the user's language isn't
 * stored — the link itself returns them to the language they signed up from.
 */
export function verificationEmail(
  user: { name: string },
  url: string,
): NotificationEmail {
  return {
    subject: "Verifica la tua email / Verify your email — The Cassettas Blog",
    text: `Ciao ${user.name},

conferma il tuo indirizzo email aprendo questo link:
${url}

Dopo la verifica, il tuo account resta in attesa di approvazione da parte di un amministratore.

---

Hi ${user.name},

please confirm your email address by opening this link:
${url}

After verifying, your account still awaits admin approval.

— The Cassettas Blog`,
  };
}

/**
 * Deliver an email via Resend. Returns true only when Resend accepted it;
 * false when Resend is unconfigured or the send failed (logged, never thrown).
 */
export async function sendEmail(
  to: string,
  email: NotificationEmail,
): Promise<boolean> {
  const apiKey = env("RESEND_API_KEY");
  if (!apiKey || !to) return false;

  // Resend's shared test sender; deliverable only to the Resend account owner.
  // Set NOTIFY_EMAIL_FROM to a verified-domain address for user-facing mail.
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

/** Deliver a notification to the admin inbox (NOTIFY_EMAIL_TO). */
export async function sendAdminNotification(
  email: NotificationEmail,
): Promise<boolean> {
  const to = env("NOTIFY_EMAIL_TO");
  if (!to) return false;
  return sendEmail(to, email);
}

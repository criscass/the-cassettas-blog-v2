import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { user as userTable } from "@db/schema";
import { approvalErrorMessage, requiresApproval } from "@lib/auth-approval";
import {
  GOOGLE_NAME_COOKIE,
  INTRODUCTION_COOKIE,
  introductionFromCookie,
  isValidIntroduction,
  nameFromCookie,
  normalizeIntroduction,
} from "@lib/introduction";
import {
  newPendingUserEmail,
  sendAdminNotification,
  sendEmail,
  verificationEmail,
} from "@lib/notifications";

const env = (key: string): string | undefined =>
  import.meta.env?.[key] ?? process.env[key];

const googleClientId = env("GOOGLE_CLIENT_ID");
const googleClientSecret = env("GOOGLE_CLIENT_SECRET");

// Better Auth signs session cookies with `secret` and keys its origin/CSRF
// checks off `baseURL` — running without either silently weakens both, so
// refuse to boot in production instead.
if (
  import.meta.env.PROD &&
  (!env("BETTER_AUTH_URL") || !env("BETTER_AUTH_SECRET"))
) {
  throw new Error(
    "[auth] BETTER_AUTH_URL and BETTER_AUTH_SECRET must be set in production",
  );
}

export const auth = betterAuth({
  baseURL: env("BETTER_AUTH_URL"),
  secret: env("BETTER_AUTH_SECRET"),

  database: drizzleAdapter(db, {
    provider: "pg",
    // schema uses Better Auth's default singular table/column names
  }),

  // No auto-sign-in: a brand-new sign-up is `pending`, so we must NOT create a
  // session for it. The sign-up page shows an "awaiting approval" message
  // instead. (Google OAuth still creates the user, then the session-create hook
  // below blocks the session with the same FORBIDDEN message.)
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    // Unverified emails can't sign in; the attempt re-sends the verification
    // link (sendOnSignIn below), so a lost email is always recoverable.
    requireEmailVerification: true,
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, url }) => {
      const sent = await sendEmail(user.email, verificationEmail(user, url));
      if (!sent) {
        if (env("RESEND_API_KEY")) {
          // Real send failure: the URL is a live verification token, so it
          // must never reach the (production) logs.
          console.warn(
            `[auth] verification email to ${user.email} failed to send`,
          );
        } else {
          // Resend unconfigured (local dev): surface the link in the server
          // log so the flow stays completable.
          console.warn(
            `[auth] verification email NOT sent to ${user.email}; link: ${url}`,
          );
        }
      }
    },
  },

  // Let a Google sign-in attach to an existing email/password user with the
  // same address instead of failing with `account_not_linked`. Linking still
  // requires the local email to be verified (Better Auth default), which the
  // verification flow above provides — so a squatter who signed up with
  // someone else's address (and thus can't verify it) can't be linked to.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  // Only register Google when both credentials are present, so a missing
  // .env entry doesn't crash startup during local/static development.
  ...(googleClientId && googleClientSecret
    ? {
        socialProviders: {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        },
      }
    : {}),

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false, // never settable by the client; admins set it server-side
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "pending",
        input: false, // never settable by the client
      },
      // Anti-spam: every sign-up must explain how they know the admin.
      // `required: false` because Google sign-ups don't send it in the body —
      // the email path enforces it in the before-hook below; the Google path
      // carries it in a cookie, read by the user-create database hook.
      introduction: {
        type: "string",
        required: false,
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;
      const introduction = normalizeIntroduction(ctx.body?.introduction);
      if (!isValidIntroduction(introduction)) {
        throw new APIError("BAD_REQUEST", {
          message:
            "Please write a few words about who you are and how we know each other.",
          code: "INTRODUCTION_REQUIRED",
        });
      }
      // Store the trimmed value.
      return {
        context: { ...ctx, body: { ...ctx.body, introduction } },
      };
    }),
  },

  databaseHooks: {
    user: {
      create: {
        // Google sign-ups bypass the /sign-up/email before-hook above, so the
        // anti-spam introduction gate for them lives here: SignUpForm stashes
        // the text in a short-lived cookie before redirecting to Google, and
        // this hook attaches it to the new user row. Without a valid value the
        // sign-up is refused — Better Auth's OAuth callback catches the
        // APIError and redirects to errorCallbackURL with ?error=<message>,
        // which is why the message is the underscore code itself (the catch in
        // link-account.ts forwards `e.message`, not `e.body.code`).
        before: async (newUser, ctx) => {
          if (isValidIntroduction(newUser.introduction)) return; // email path

          const introduction = introductionFromCookie(
            ctx?.getCookie(INTRODUCTION_COOKIE),
          );
          // The Google-mode sign-up form also lets the user pick their display
          // name; it overrides the Google profile name when present.
          const name = nameFromCookie(ctx?.getCookie(GOOGLE_NAME_COOKIE));
          ctx?.setCookie(INTRODUCTION_COOKIE, "", { path: "/", maxAge: 0 });
          ctx?.setCookie(GOOGLE_NAME_COOKIE, "", { path: "/", maxAge: 0 });

          if (!isValidIntroduction(introduction)) {
            throw new APIError("BAD_REQUEST", {
              message: "INTRODUCTION_REQUIRED",
              code: "INTRODUCTION_REQUIRED",
            });
          }
          return {
            data: { ...newUser, introduction, ...(name ? { name } : {}) },
          };
        },
        // Every sign-up (email/password AND Google) creates the user row here,
        // so this single hook covers both: tell the admin someone is waiting
        // in the approval queue. sendAdminNotification never throws, so a mail
        // failure can't break sign-up.
        after: async (newUser) => {
          await sendAdminNotification(
            newPendingUserEmail(
              newUser as { name: string; email: string; introduction?: string | null },
              env("BETTER_AUTH_URL"),
            ),
          );
        },
      },
    },
    session: {
      create: {
        // Single uniform gate for BOTH email/password and Google OAuth: every
        // sign-in flows through session creation, so blocking here blocks
        // unapproved accounts everywhere. See BLOG_V2_PLAN.md §13b.
        before: async (session) => {
          const rows = await db
            .select({ status: userTable.status })
            .from(userTable)
            .where(eq(userTable.id, session.userId))
            .limit(1);
          const status = rows[0]?.status;

          if (requiresApproval(status)) {
            // Use distinct codes so the sign-in form can show a localised
            // message without parsing English server text. Better Auth's OAuth
            // callback catch block requires `code` to be present so it calls
            // redirectOnError (appending ?error=<code>) instead of re-throwing.
            const code =
              status === "rejected" ? "ACCOUNT_REJECTED" : "ACCOUNT_PENDING";
            throw new APIError("FORBIDDEN", {
              message: approvalErrorMessage(status),
              code,
            });
          }

          return { data: session };
        },
      },
    },
  },
});

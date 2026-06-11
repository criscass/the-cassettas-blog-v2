import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { user as userTable } from "@db/schema";
import { approvalErrorMessage, requiresApproval } from "@lib/auth-approval";
import { newPendingUserEmail, sendAdminNotification } from "@lib/notifications";

const env = (key: string): string | undefined =>
  import.meta.env?.[key] ?? process.env[key];

const googleClientId = env("GOOGLE_CLIENT_ID");
const googleClientSecret = env("GOOGLE_CLIENT_SECRET");

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
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Every sign-up (email/password AND Google) creates the user row here,
        // so this single hook covers both: tell the admin someone is waiting
        // in the approval queue. sendAdminNotification never throws, so a mail
        // failure can't break sign-up.
        after: async (newUser) => {
          await sendAdminNotification(
            newPendingUserEmail(newUser, env("BETTER_AUTH_URL")),
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
            throw new APIError("FORBIDDEN", {
              message: approvalErrorMessage(status),
              // `code` must be present so Better Auth's OAuth callback catch block
              // calls redirectOnError instead of re-throwing raw JSON.
              code: "FORBIDDEN",
            });
          }

          return { data: session };
        },
      },
    },
  },
});

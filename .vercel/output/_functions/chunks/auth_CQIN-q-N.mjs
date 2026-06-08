import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import { d as db, u as user } from './index_CLT99qYk.mjs';
import { r as requiresApproval, a as approvalErrorMessage } from './auth-approval_D-FgCjcG.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "PUBLIC_TEST": "Public Value", "SITE": "http://www.cassettas-reboot.xyz/", "SSR": true};
const env = (key) => Object.assign(__vite_import_meta_env__, { BETTER_AUTH_SECRET: "QNaCLck9bDlcdfzE5Fbrk6/EkV8KpcJUse9NuKT6dkg=", BETTER_AUTH_URL: "http://localhost:4321", GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", _: process.env._ })?.[key] ?? process.env[key];
const googleClientId = env("GOOGLE_CLIENT_ID");
const googleClientSecret = env("GOOGLE_CLIENT_SECRET");
const auth = betterAuth({
  baseURL: env("BETTER_AUTH_URL"),
  secret: env("BETTER_AUTH_SECRET"),
  database: drizzleAdapter(db, {
    provider: "pg"
    // schema uses Better Auth's default singular table/column names
  }),
  // No auto-sign-in: a brand-new sign-up is `pending`, so we must NOT create a
  // session for it. The sign-up page shows an "awaiting approval" message
  // instead. (Google OAuth still creates the user, then the session-create hook
  // below blocks the session with the same FORBIDDEN message.)
  emailAndPassword: {
    enabled: true,
    autoSignIn: false
  },
  // Only register Google when both credentials are present, so a missing
  // .env entry doesn't crash startup during local/static development.
  ...googleClientId && googleClientSecret ? {
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret
      }
    }
  } : {},
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false
        // never settable by the client; admins set it server-side
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "pending",
        input: false
        // never settable by the client
      }
    }
  },
  databaseHooks: {
    session: {
      create: {
        // Single uniform gate for BOTH email/password and Google OAuth: every
        // sign-in flows through session creation, so blocking here blocks
        // unapproved accounts everywhere. See BLOG_V2_PLAN.md §13b.
        before: async (session) => {
          const rows = await db.select({ status: user.status }).from(user).where(eq(user.id, session.userId)).limit(1);
          const status = rows[0]?.status;
          if (requiresApproval(status)) {
            throw new APIError("FORBIDDEN", {
              message: approvalErrorMessage(status)
            });
          }
          return { data: session };
        }
      }
    }
  }
});

export { auth as a };

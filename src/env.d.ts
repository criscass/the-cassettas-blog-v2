/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  // Better Auth's base user plus our custom additionalFields (role/status).
  type AuthUser = import("better-auth").User & {
    role?: string | null;
    status?: string | null;
  };

  interface Locals {
    // Populated by src/middleware.ts on SSR requests. Null when not signed in
    // (or on prerendered routes, where the middleware skips the session lookup).
    user: AuthUser | null;
    session: import("better-auth").Session | null;
  }
}

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
  // Keystatic GitHub OAuth app — required in production for CMS git commits
  readonly KEYSTATIC_GITHUB_CLIENT_ID?: string;
  readonly KEYSTATIC_GITHUB_CLIENT_SECRET?: string;
  // Optional: used by Keystatic to sign its own session cookies
  readonly KEYSTATIC_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

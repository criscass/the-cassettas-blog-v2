import { defineMiddleware } from "astro:middleware";
import { auth } from "@lib/auth";

// Page routes that require an authenticated admin. Matched as path prefixes.
// The `/api/admin/**` endpoints guard themselves (returning JSON 401/403 via
// isAdmin) rather than redirecting, so they're intentionally not listed here.
const ADMIN_PREFIXES = ["/admin", "/keystatic"];

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Build a locale-aware sign-in URL so the redirect keeps the user's language.
function signInUrl(pathname: string): string {
  const locale = pathname.startsWith("/en/") || pathname === "/en" ? "en" : "it";
  return `/${locale}/sign-in`;
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Prerendered (static) pages are built at compile time with no real request
  // and no database — skip the session lookup entirely so the build never hits
  // Neon. locals stay null; static pages must not depend on auth state anyway.
  if (context.isPrerendered) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  const result = await auth.api.getSession({ headers: context.request.headers });
  context.locals.user = result?.user ?? null;
  context.locals.session = result?.session ?? null;

  // Admin-gated areas: signed-out users go to sign-in, non-admins get 403.
  if (isAdminRoute(context.url.pathname)) {
    if (!context.locals.user) {
      return context.redirect(signInUrl(context.url.pathname));
    }
    if (context.locals.user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return next();
});

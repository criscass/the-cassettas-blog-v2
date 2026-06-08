import { d as defineMiddleware, s as sequence } from './chunks/render-context_DBT8hwKY.mjs';
import { a as auth } from './chunks/auth_CQIN-q-N.mjs';
import 'es-module-lexer';
import './chunks/astro-designed-error-pages_DOP_OV1F.mjs';
import 'piccolore';
import './chunks/astro/server_B1FHXCvi.mjs';
import 'clsx';

const ADMIN_PREFIXES = ["/admin", "/keystatic"];
function isAdminRoute(pathname) {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
function signInUrl(pathname) {
  const locale = pathname.startsWith("/en/") || pathname === "/en" ? "en" : "it";
  return `/${locale}/sign-in`;
}
const onRequest$1 = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }
  const result = await auth.api.getSession({ headers: context.request.headers });
  context.locals.user = result?.user ?? null;
  context.locals.session = result?.session ?? null;
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

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };

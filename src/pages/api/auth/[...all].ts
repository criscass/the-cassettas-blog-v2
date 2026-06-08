import type { APIRoute } from "astro";
import { auth } from "@lib/auth";

// Better Auth catch-all. Every /api/auth/* request (sign-in, sign-up, OAuth
// callbacks, session, sign-out) is forwarded to the Better Auth handler.
// SSR-only — must never be prerendered.
export const prerender = false;

export const ALL: APIRoute = ({ request }) => auth.handler(request);

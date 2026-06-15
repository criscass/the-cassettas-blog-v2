import type { APIRoute } from "astro";
import { isHoneypotTripped, validateContactInput } from "@lib/contact";
import { contactFormEmail, sendAdminNotification } from "@lib/notifications";

// SSR — sends mail per request.
export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Lightweight in-memory sliding-window rate limit, keyed by client IP.
// Caveat: serverless instances don't share memory and recycle, so this only
// throttles bursts on a single warm instance — adequate for a small blog, not
// a hard guarantee. Pair it with the honeypot rather than relying on it alone.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > RATE_LIMIT_MAX;
}

// POST /api/contact  body: { name, email, message, website (honeypot) }
export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // A filled honeypot means a bot — accept silently so it gets no signal.
  if (isHoneypotTripped(body)) {
    return json({ ok: true });
  }

  if (isRateLimited(clientAddress ?? "unknown")) {
    return json({ error: "Too many messages — please try again later." }, 429);
  }

  const result = validateContactInput(body);
  if (!result.ok) {
    return json({ error: result.error }, 400);
  }

  // Never throws; no-ops when Resend is unconfigured (mirrors /api/comments).
  await sendAdminNotification(contactFormEmail(result.value));

  return json({ ok: true });
};

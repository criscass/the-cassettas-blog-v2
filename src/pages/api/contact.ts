import type { APIRoute } from "astro";
import { isHoneypotTripped, validateContactInput } from "@lib/contact";
import { contactFormEmail, sendAdminNotification } from "@lib/notifications";
import { createRateLimiter } from "@lib/rate-limit";

// SSR — sends mail per request.
export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Rate limit keyed by client IP; pair it with the honeypot rather than
// relying on it alone (see the caveat in @lib/rate-limit).
const isRateLimited = createRateLimiter(5, 10 * 60 * 1000); // 5 per 10 minutes

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

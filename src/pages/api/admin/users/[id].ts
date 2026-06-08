import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { user } from "@db/schema";
import { isAdmin, parseStatusUpdate } from "@lib/admin";

// SSR — admin-only mutation against the user table.
export const prerender = false;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// PATCH /api/admin/users/:id  body: { status: 'approved' | 'rejected' }
// Direct Drizzle update of the user's approval status (no Better Auth admin
// plugin needed). Admin-only.
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return json({ error: "You must be signed in" }, 401);
  }
  if (!isAdmin(locals.user)) {
    return json({ error: "Admin access required" }, 403);
  }

  const id = params.id;
  if (!id) {
    return json({ error: "Missing user id" }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = parseStatusUpdate(body);
  if (!parsed.ok) {
    return json({ error: parsed.error }, 400);
  }

  const [updated] = await db
    .update(user)
    .set({ status: parsed.status, updatedAt: new Date() })
    .where(eq(user.id, id))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });

  if (!updated) {
    return json({ error: "User not found" }, 404);
  }

  return json({ user: updated });
};

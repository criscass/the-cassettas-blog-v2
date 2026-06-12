import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { user } from "@db/schema";
import { canDeleteUser, isAdmin, parseStatusUpdate } from "@lib/admin";

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
      introduction: user.introduction,
    });

  if (!updated) {
    return json({ error: "User not found" }, 404);
  }

  return json({ user: updated });
};

// DELETE /api/admin/users/:id
// Removes the user row; sessions, accounts and comments go with it via the
// schema's onDelete cascades. Admin accounts can't be deleted (see canDeleteUser).
export const DELETE: APIRoute = async ({ params, locals }) => {
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

  const [target] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, id));

  if (!target) {
    return json({ error: "User not found" }, 404);
  }
  if (!canDeleteUser(target)) {
    return json({ error: "Admin accounts can't be deleted" }, 403);
  }

  await db.delete(user).where(eq(user.id, id));

  return json({ ok: true });
};

import { eq } from 'drizzle-orm';
import { d as db, u as user } from '../../../../chunks/index_CLT99qYk.mjs';
export { renderers } from '../../../../renderers.mjs';

function isAdmin(user) {
  return user?.role === "admin";
}
const ADMIN_UPDATABLE_STATUSES = ["approved", "rejected"];
function isAdminUpdatableStatus(value) {
  return value === "approved" || value === "rejected";
}
function parseStatusUpdate(body) {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body" };
  }
  const status = body.status;
  if (!isAdminUpdatableStatus(status)) {
    return {
      ok: false,
      error: `status must be one of: ${ADMIN_UPDATABLE_STATUSES.join(", ")}`
    };
  }
  return { ok: true, status };
}

const prerender = false;
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
const PATCH = async ({ params, request, locals }) => {
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
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const parsed = parseStatusUpdate(body);
  if (!parsed.ok) {
    return json({ error: parsed.error }, 400);
  }
  const [updated] = await db.update(user).set({ status: parsed.status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(user.id, id)).returning({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  });
  if (!updated) {
    return json({ error: "User not found" }, 404);
  }
  return json({ user: updated });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  PATCH,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

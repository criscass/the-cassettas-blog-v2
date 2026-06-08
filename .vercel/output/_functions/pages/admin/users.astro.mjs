import { c as createComponent, r as renderComponent, a as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_B1FHXCvi.mjs';
import 'piccolore';
import { desc } from 'drizzle-orm';
import { $ as $$Layout, a as $$Container } from '../../chunks/Layout_B1TKN_0b.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useState } from 'react';
import { d as db, u as user } from '../../chunks/index_CLT99qYk.mjs';
export { renderers } from '../../renderers.mjs';

const STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};
const STATUS_CLASS = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  approved: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",
  rejected: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
};
function AdminUsers({ initialUsers }) {
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  async function updateStatus(id, status) {
    setBusyId(id);
    setError(null);
    const previous = users;
    setUsers(
      (prev) => prev.map((u) => u.id === id ? { ...u, status } : u)
    );
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("update failed");
      const data = await res.json();
      setUsers((prev) => prev.map((u) => u.id === id ? data.user : u));
    } catch {
      setUsers(previous);
      setError("Couldn't update that user. Please try again.");
    } finally {
      setBusyId(null);
    }
  }
  if (users.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "text-sm text-black/60 dark:text-white/60", children: "No users yet." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    error && /* @__PURE__ */ jsx("p", { role: "alert", className: "text-sm text-red-700 dark:text-red-300", children: error }),
    /* @__PURE__ */ jsx("ul", { className: "flex flex-col gap-3", children: users.map((u) => {
      const busy = busyId === u.id;
      return /* @__PURE__ */ jsxs(
        "li",
        {
          className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-4 dark:border-white/10",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium text-black dark:text-white", children: u.name }),
                u.role === "admin" && /* @__PURE__ */ jsx("span", { className: "rounded border border-black/20 px-1.5 py-0.5 text-xs dark:border-white/20", children: "admin" }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `rounded border px-1.5 py-0.5 text-xs ${STATUS_CLASS[u.status]}`,
                    children: STATUS_LABEL[u.status]
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("p", { className: "truncate text-sm text-black/60 dark:text-white/60", children: u.email })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  disabled: busy || u.status === "approved",
                  onClick: () => updateStatus(u.id, "approved"),
                  className: "rounded-lg border border-green-600/40 px-3 py-1.5 text-sm font-medium text-green-700 disabled:opacity-40 dark:text-green-300",
                  children: "Approve"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  disabled: busy || u.status === "rejected",
                  onClick: () => updateStatus(u.id, "rejected"),
                  className: "rounded-lg border border-red-600/40 px-3 py-1.5 text-sm font-medium text-red-700 disabled:opacity-40 dark:text-red-300",
                  children: "Reject"
                }
              )
            ] })
          ]
        },
        u.id
      );
    }) })
  ] });
}

const prerender = false;
const $$Users = createComponent(async ($$result, $$props, $$slots) => {
  const rows = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  }).from(user).orderBy(desc(user.createdAt));
  const STATUS_ORDER = { pending: 0, approved: 1, rejected: 2 };
  const users = rows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })).sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Users", "description": "User approval queue" }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Container", $$Container, {}, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="animate space-y-6"> <h1 class="text-2xl font-semibold text-black dark:text-white">
User approval
</h1> ${renderComponent($$result3, "AdminUsers", AdminUsers, { "initialUsers": users, "client:load": true, "client:component-hydration": "load", "client:component-path": "@components/admin/AdminUsers.tsx", "client:component-export": "default" })} </div> ` })} ` })}`;
}, "/Users/cristiancassetta/DEV/websites and apps/The-Cassettas-blog/the-cassettas-blog-v2/src/pages/admin/users.astro", void 0);

const $$file = "/Users/cristiancassetta/DEV/websites and apps/The-Cassettas-blog/the-cassettas-blog-v2/src/pages/admin/users.astro";
const $$url = "/admin/users";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Users,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };

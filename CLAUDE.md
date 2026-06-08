# CLAUDE.md

Guidance for Claude Code when working in **the-cassettas-blog-v2**.

## What this is

A v2 rebuild of an existing static Astro blog (The Cassettas Blog) into a
**hybrid SSR** site. The full design doc lives one level up at
[../BLOG_V2_PLAN.md](../BLOG_V2_PLAN.md) — that is the source of truth; consult
it for rationale and detail. This file is the working summary.

The v2 adds, on top of the existing 104 markdown posts (52 IT + 52 EN):
- Per-post **comments** with auth (React island)
- **Auth + access control** (admin / approved commenter / anonymous reader)
- **Admin panel**: user-approval queue + Keystatic CMS for writing posts
- Deployment on **Vercel**

### Current state

**Phase 1 (Foundation) is done**: Tailwind v4, React, MDX, sitemap, Pagefind,
and the Vercel adapter are wired up; all components/layouts/lib/styles/content
(104 posts + images) are ported from the old blog; pages rebuilt for `it`/`en`
+ RSS + 404; `npm run build` produces the same page count as the old site (109
pages, 110 Pagefind-indexed). Vitest is set up with passing unit tests for
`utils.ts` and `remark-image-captions.js`.

**Phase 2 (Auth) is done** (code-complete; needs a real Neon DB to run):
- Drizzle schema (`src/db/schema.ts`: `user` w/ custom `role`+`status`,
  `session`, `account`, `verification`) + Neon HTTP client (`src/db/index.ts`).
- Better Auth (`src/lib/auth.ts`): email+password (`autoSignIn: false`), Google
  OAuth (only registered when both env creds are present), `role`/`status`
  additionalFields (`input: false`), and the approval gate as a
  `databaseHooks.session.create.before` hook that throws `APIError('FORBIDDEN')`
  for any non-`approved` user — covering both email/pw and Google.
- The gate rule is extracted as pure functions in `src/lib/auth-approval.ts`
  (`requiresApproval` / `approvalErrorMessage`) and unit-tested
  (`src/lib/__tests__/auth-approval.test.ts`).
- Auth catch-all endpoint `src/pages/api/auth/[...all].ts` (`prerender = false`,
  forwards `ALL` to `auth.handler`). Browser client `src/lib/auth-client.ts`.
- `src/middleware.ts`: populates `Astro.locals.user`/`session`; guards `/admin`
  + `/keystatic` (signed-out → locale sign-in, non-admin → 403). **Guarded with
  `context.isPrerendered`** so static-page prerendering never hits the DB at
  build time. `App.Locals` typed in `src/env.d.ts`.
- Sign-in / sign-up pages for `it` + `en` (`src/pages/{it,en}/sign-{in,up}.astro`)
  rendering React islands (`src/components/auth/`), with pending-approval
  messaging. Pages are static; auth runs client-side via the API route.
- `npm test` → 23 passing; `npm run build` → 114 Pagefind pages; `astro check`
  → 0 errors.

⚠️ **The local `.env` `DATABASE_URL` is a placeholder.** Auth/DB won't actually
work until a real Neon connection string is set and `npm run db:push` is run
(deferred — user provisions Neon). Build/dev/test all run fine without it
because the Neon HTTP client makes no connection until the first query, and the
middleware's `isPrerendered` guard avoids queries during the build.

**Phase 3 (Comments) is done** (code-complete; needs a real Neon DB to run):
- `comment` table in `src/db/schema.ts` (`id` uuid, `postId`, `language`,
  `userId` fk→user cascade, `content`, `createdAt`) — **no status column**;
  every comment from an approved user shows immediately.
- Pure comment rules in `src/lib/comments.ts` (`validateCommentInput`,
  `canUserComment`, `isSupportedLanguage`, `COMMENT_MAX_LENGTH = 2000`),
  unit-tested in `src/lib/__tests__/comments.test.ts`.
- `src/pages/api/comments.ts` (`prerender = false`): `GET ?postId=&language=`
  returns comments + author name (join on `user`); `POST` requires
  `locals.user` + `canUserComment` (401/403 otherwise), validates, inserts.
- `src/components/CommentsSection.tsx` island: fetches on mount, lists comments,
  shows the form for approved users / a pending notice for unapproved /
  sign-in link for anonymous, optimistic append on submit. Wired into both
  `[...slug].astro` pages via `client:visible`, `postId={cleanSlug(post.id)}`.
- Component test `src/components/__tests__/CommentsSection.test.tsx` (mocks
  `useSession` + `fetch`). Needed `@testing-library/dom` (added as devDep).
- **`auth-client.ts` now imports `createAuthClient` from `better-auth/react`**
  (not `/client`) so `useSession` is a real React hook, not a nanostore atom —
  required for the island to render under SSR.
- `npm test` → 39 passing; `npm run build` → 114 pages; `astro check` → 0 errors.

**Phase 4 (Admin: user approval) is done** (code-complete; needs a real Neon DB):
- Pure admin rules in `src/lib/admin.ts` (`isAdmin`, `isAdminUpdatableStatus`,
  `parseStatusUpdate` — only `approved`/`rejected` are valid manual targets),
  unit-tested in `src/lib/__tests__/admin.test.ts`.
- `src/pages/api/admin/users/[id].ts` `PATCH` (`prerender = false`): self-guards
  with `isAdmin(locals.user)` (401 signed-out / 403 non-admin), validates the
  `{ status }` body, then a direct Drizzle `update` of `user.status` (no Better
  Auth admin plugin); 404 if the id doesn't exist.
- `src/pages/admin/users.astro` (`prerender = false`, admin-gated by middleware):
  loads all users server-side (pending first), passes them to the
  `src/components/admin/AdminUsers.tsx` island (Approve/Reject buttons, optimistic
  update with rollback on failure). `src/pages/admin/index.astro` redirects to it.
- Component test `src/components/admin/__tests__/AdminUsers.test.tsx`.
- Route protection: `/admin/**` pages are guarded by `src/middleware.ts`
  (`role === 'admin'`, else sign-in redirect / 403); `/api/admin/**` self-guards
  with JSON 401/403 (so it's deliberately *not* in the middleware prefix list).
- `npm test` → 50 passing; `npm run build` → 114 static pages (admin routes are
  on-demand); `astro check` → 0 errors.

⚠️ To exercise the admin panel you need an admin user: after `db:push` + sign-up,
manually set that row's `role = 'admin'` and `status = 'approved'` in the DB
(there's no bootstrap UI — by design, since the first admin can't approve itself).

Phases 5–6 (Keystatic, deploy) are **not started** — verify what exists before
assuming a feature is present.

### Notable deviations from the plan during the Phase 1 port

- **Tailwind v4** (CSS-first `@theme`/`@plugin` in `global.css`, no
  `tailwind.config.mjs`) was used instead of v3 — `astro add tailwind` installs
  v4 by default now and the user chose to keep it. The old `tailwind.config.mjs`
  theme (Geist fonts, `darkMode: "class"` via `@custom-variant dark`,
  `@tailwindcss/typography`) was ported into `global.css` as-is — the §3
  warm-palette redesign (ink/surface/border/text/accent tokens) has **not**
  been applied yet; current styling still matches the old neutral-gray theme
  for parity ("should produce the same output as the old site").
- **`output: 'hybrid'` doesn't exist in Astro 5** — it was merged into
  `output: 'static'` (the default), where pages are prerendered unless they
  opt out with `export const prerender = false`. `astro.config.mjs` relies on
  this default + the Vercel adapter; no explicit `output` is set.
- **Pinned older adapter/integration versions** because the latest majors
  require Astro 6 (we're on Astro 5.18): `@astrojs/vercel@9.0.5` (latest
  requires `astro ^6`), `@astrojs/mdx@^4.3.6`, `astro-pagefind@^1.8.6` (the new
  v2 rewrote the `Search` component on a different API/CSS — pinning to 1.8.6
  keeps `PageFind.astro` and its styles working unchanged).
- Removed `Giscus.astro` (dead/unused even in the old blog — comments are being
  rebuilt as a custom React island per the plan, so it made no sense to port).

## Project layout

This project is a sibling of the still-live original blog:

```
The-Cassettas-blog/
├── the-cassettas-blog/        ← current blog (KEEP LIVE — don't touch unless asked)
├── the-cassettas-blog-v2/     ← this project
└── BLOG_V2_PLAN.md            ← full plan
```

When porting, copy from `../the-cassettas-blog/`:
`src/components/`, `src/layouts/`, `src/styles/`, `src/lib/`, `src/consts.ts`,
`src/types.ts`, `src/content.config.ts`, `tailwind.config.mjs`,
`.prettierrc.mjs`, plus `src/content/blog/` (all 104 posts) and
`src/assets/images/`.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Astro 5, `output: 'static'` (prerender by default; opt out per-route with `export const prerender = false`) |
| UI islands | React (`@astrojs/react`) |
| Styling | Tailwind CSS |
| Deploy | Vercel (`@astrojs/vercel`) |
| Auth | Better Auth (email+password + Google OAuth) |
| Database | Neon serverless PostgreSQL |
| ORM | Drizzle (`drizzle-orm` + `drizzle-kit`) |
| CMS | Keystatic (`@keystatic/core` + `@keystatic/astro`) |
| Image upload | Vercel Blob (`@vercel/blob`) |
| Class utils | `clsx` + `tailwind-merge` |

## Commands

```bash
npm run dev        # astro dev
npm run build      # astro build
npm run preview    # astro preview
npm test           # vitest run (unit tests for src/lib/* live in __tests__ dirs)
npm run test:watch # vitest (watch mode)
# Once added per later phases:
# npm run test:e2e # Playwright
# npx drizzle-kit push   # apply schema to Neon
```

## Rendering mode

`output: 'static'` — pages are prerendered by default; a route opts into SSR
with `export const prerender = false`. SSR routes:
- `/api/auth/**` (Better Auth catch-all) — **done** (Phase 2)
- `/api/comments` (GET read / POST write, auth required) — **done** (Phase 3)
- `/api/admin/users/[id]` (PATCH, admin-only) + `/admin/**` pages — **done** (Phase 4)
- `/keystatic/**` (admin-gated CMS UI) — Phase 5

Everything under `/it/` and `/en/` (homepages, blog lists, posts, **and the
sign-in/sign-up pages** — auth happens client-side) is prerendered. The
middleware skips its session lookup on prerendered routes via
`context.isPrerendered`, so the build never touches the DB.

## Auth & access model

- **Admin**: Keystatic access + user-approval queue.
- **User**: can sign up, but is created `status: 'pending'` and **cannot sign in
  until an admin approves**. Once approved, comments post immediately (no
  per-comment moderation).
- **Anonymous**: read posts and comments only.
- A `databaseHooks.session.create.before` hook throws `APIError('FORBIDDEN', …)`
  when `status !== 'approved'` — this single gate covers both email/password and
  Google OAuth. Extract the `status !== 'approved'` check as a pure function so
  it's unit-testable.
- `src/middleware.ts` enforces route guards on `/admin`, `/keystatic`, and API
  routes; sessions via Better Auth HTTP-only cookies.

## Database (Neon / Postgres, via Drizzle)

- Better Auth owns `users` (with custom `status` additionalField:
  `pending | approved | rejected`, default `pending`, `input: false`),
  `sessions`, `accounts`.
- Custom `comments` table: `id`, `post_id` (e.g. `"post-00042"`), `language`
  (`it`/`en`), `user_id`, `content`, `created_at`. **No status column** — every
  comment from an approved user shows immediately.

## Content conventions (unchanged from v1)

- Posts: `src/content/blog/[lang]/post-XXXXX/index.md` (`it` and `en`).
- Frontmatter: `title`, `description`, `date`, optional `draft` (drafts excluded
  from build), `language`.
- Images use relative paths; the title attribute becomes an italic caption via
  the custom remark plugin `src/lib/remark-image-captions.js`.
- `cleanSlug()` in `src/lib/utils.ts` strips language prefix + extension from
  content IDs.
- Path aliases: `@*` → `./src/*` (e.g. `@components/Foo`, `@lib/utils`).
- Image naming in v1 is mixed (`post-1`…`post-41`, then `post-00042`+) — preserve.

## Testing strategy

Build tests in as features land (v1 had none):
- **Unit (Vitest)**: `src/lib/utils.ts` helpers, the remark-captions AST
  transform, the approval-gate predicate.
- **Integration (Vitest + test DB)**: `/api/comments`, `/api/admin/users/[id]`,
  middleware route guards — against a disposable Neon branch / local Postgres.
- **Component (Vitest + Testing Library)**: `CommentsSection.tsx`.
- **E2E (Playwright)**: golden path in both languages, language toggle, full
  sign-up → pending → approve → comment flow, admin queue, Keystatic gating,
  Pagefind search.

## Build order (phases)

Follow §9 of the plan. Summary: **1** Foundation (scaffold, Tailwind, React,
Vercel adapter, port v1 files + content, rebuild pages) → **2** Auth (Drizzle
schema, Better Auth, approval gate, middleware, sign-in/up pages) → **3**
Comments (table, `/api/comments`, `CommentsSection.tsx` island) → **4** Admin
user approval (`/admin/users`, PATCH endpoint) → **5** Keystatic post creation →
**6** Deploy. Each phase has matching tests (steps marked `Na` in the plan).

## Design direction

Elegant, **dark-first** warm palette built on a single amber/gold accent. Define
tokens (`ink`, `surface`, `border`, `text`, `accent`) in `tailwind.config.mjs`
and pull from them everywhere (e.g. `bg-surface`, `border-border`,
`text-accent`) — do **not** hardcode `black/15`, `neutral-900`, `blue-800`, etc.
Keep Geist / Geist Mono and the existing `.animate` fade-in / `duration-300
ease-in-out` rhythm; use larger radii (`rounded-xl`). See §3 of the plan for the
color table and component-level guidance.

## Environment variables

```env
DATABASE_URL=
BETTER_AUTH_SECRET=                 # random 32-char string
BETTER_AUTH_URL=                    # site base URL
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
BLOB_READ_WRITE_TOKEN=
KEYSTATIC_GITHUB_CLIENT_ID=
KEYSTATIC_GITHUB_CLIENT_SECRET=
```

Never commit secrets; set production values in the Vercel dashboard.

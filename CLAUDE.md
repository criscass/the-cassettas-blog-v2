# CLAUDE.md

Guidance for Claude Code when working in **the-cassettas-blog-v2**.

## What this is

A v2 rebuild of an existing static Astro blog (The Cassettas Blog) into a
**hybrid SSR** site. The full design doc lives one level up at
[../BLOG_V2_PLAN.md](../BLOG_V2_PLAN.md) — the source of truth for rationale and
detail. This file is the working summary.

On top of the existing 104 markdown posts (52 IT + 52 EN), v2 adds:
- Per-post **comments** with auth (React island)
- **Auth + access control** (admin / approved commenter / anonymous reader)
- **Admin panel**: user-approval queue + Keystatic CMS for writing posts
- Deployment on **Vercel**

## Current state

| Phase | Status |
|---|---|
| 1 — Foundation (scaffold, Tailwind, React, Vercel adapter, port v1 + content) | ✅ done |
| 2 — Auth (Drizzle schema, Better Auth, approval gate, middleware, sign-in/up) | ✅ done |
| 3 — Comments (table, `/api/comments`, `CommentsSection.tsx` island) | ✅ done |
| 4 — Admin user approval (`/admin/users`, PATCH endpoint) | ✅ done |
| 5 — Keystatic post creation | ⬜ not started |
| 6 — Deploy | ✅ done |

Phases 1,2,3,4 and 6 are code-complete.

⚠️ **Gotchas that aren't obvious from the code:**
- **No admin bootstrap UI** (by design — the first admin can't approve itself).
  After `db:push` + sign-up, manually set that row's `role = 'admin'` and
  `status = 'approved'` in the DB to exercise the admin panel.

Sanity checks: `npm test` (50 passing), `npm run build` (114 pages), `astro check` (0 errors).

## Project layout

Sibling of the still-live original blog:

```
The-Cassettas-blog/
├── the-cassettas-blog/        ← current blog (KEEP LIVE — don't touch unless asked)
├── the-cassettas-blog-v2/     ← this project
└── BLOG_V2_PLAN.md            ← full plan
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Astro 5, `output: 'static'` (prerender by default; opt out per-route with `export const prerender = false`) |
| UI islands | React (`@astrojs/react`) |
| Styling | Tailwind CSS **v4** (CSS-first `@theme`/`@plugin` in `global.css`, no `tailwind.config.mjs`) |
| Deploy | Vercel (`@astrojs/vercel`) |
| Auth | Better Auth (email+password + Google OAuth) |
| Database | Neon serverless PostgreSQL |
| ORM | Drizzle (`drizzle-orm` + `drizzle-kit`) |
| CMS | Keystatic (`@keystatic/core` + `@keystatic/astro`) |
| Image upload | Vercel Blob (`@vercel/blob`) |
| Class utils | `clsx` + `tailwind-merge` |

**Pinned versions** (latest majors require Astro 6; we're on Astro 5.18):
`@astrojs/vercel@9.0.5`, `@astrojs/mdx@^4.3.6`, `astro-pagefind@^1.8.6` (v2
rewrote the `Search` component on a different API — pinning keeps `PageFind.astro` unchanged).

## Commands

```bash
npm run dev        # astro dev
npm run build      # astro build
npm run preview    # astro preview
npm test           # vitest run (unit tests live in __tests__ dirs)
npm run test:watch # vitest watch mode
npm run db:push    # apply Drizzle schema to Neon
```

## Rendering mode

`output: 'static'` — prerendered by default; a route opts into SSR with
`export const prerender = false`. SSR routes:
- `/api/auth/**` (Better Auth catch-all)
- `/api/comments` (GET read / POST write, auth required)
- `/api/admin/users/[id]` (PATCH, admin-only) + `/admin/**` pages
- `/keystatic/**` (admin-gated CMS UI) — Phase 5

Everything under `/it/` and `/en/` is prerendered, including the sign-in/sign-up
pages (auth runs client-side via the API route).

## Auth & access model

- **Admin**: Keystatic access + user-approval queue.
- **User**: signs up as `status: 'pending'`, **cannot sign in until an admin
  approves**. Once approved, comments post immediately (no per-comment moderation).
- **Anonymous**: read posts and comments only.
- A `databaseHooks.session.create.before` hook throws `APIError('FORBIDDEN')`
  when `status !== 'approved'` — one gate covering both email/password and Google.
  The check is extracted as a pure, unit-tested function in `src/lib/auth-approval.ts`.
- `src/middleware.ts` enforces route guards on `/admin` + `/keystatic` (pages
  redirect/403); `/api/admin/**` self-guards with JSON 401/403. Sessions via
  Better Auth HTTP-only cookies.

## Database (Neon / Postgres, via Drizzle)

- Better Auth owns `user` (custom `role` + `status` additionalFields, `status`
  default `pending`, `input: false`), `session`, `account`, `verification`.
- Custom `comment` table: `id`, `post_id` (e.g. `"post-00042"`), `language`
  (`it`/`en`), `user_id`, `content`, `created_at`. **No status column** — every
  comment from an approved user shows immediately.

## Content conventions (unchanged from v1)

- Posts: `src/content/blog/[lang]/post-XXXXX/index.md` (`it` and `en`).
- Frontmatter: `title`, `description`, `date`, optional `draft` (excluded from
  build), `language`.
- Images use relative paths; the title attribute becomes an italic caption via
  the custom remark plugin `src/lib/remark-image-captions.js`.
- `cleanSlug()` in `src/lib/utils.ts` strips language prefix + extension from IDs.
- Path aliases: `@*` → `./src/*` (e.g. `@components/Foo`, `@lib/utils`).
- Image naming in v1 is mixed (`post-1`…`post-41`, then `post-00042`+) — preserve.

## Design direction

The §3 redesign is **applied**. The site uses an elegant, dark-first warm palette
on a single amber/gold accent.

### Tokens (defined in `global.css` `@theme`, overridden in `.dark`)

| Token | Light | Dark | Class usage |
|---|---|---|---|
| `ink` | `#f7f4ee` | `#0c0b0a` | `bg-ink` (page background) |
| `surface` | `#efe9dd` | `#17150f` | `bg-surface` (header, footer, cards, code blocks) |
| `border` | `rgb(0 0 0 / 0.10)` | `rgb(255 255 255 / 0.10)` | `border-border` (all outlines) |
| `muted` | `#2b2620` | `#f3efe7` | CSS var only — set on `body` as body-copy color |
| `accent` | `#9c7530` | `#d8b167` | `text-accent`, `border-accent`, `bg-accent/10`, `decoration-accent` |

> Note: the plan named the body-copy token `text`; it was implemented as `muted`
> to avoid the awkward `text-text` Tailwind class.

### What was changed

- `global.css` — tokens + `bg-ink` body, `bg-surface/80` header, warm Shiki
  syntax palette, `copy-code` button restyled with accent hover
- `Callout.astro` — unified `bg-surface/60` + `border-l-4` colored by type
  (gold / sky / amber / rose), replacing four clashing vivid backgrounds
- `ArrowCard`, `PostNavigation`, `BackToTop`, `BackToPrevious` — `rounded-xl`,
  `border-border`, `hover:bg-accent/5 hover:border-accent/30`, accent arrow stroke
- `Header`, `Footer` — all buttons use `border-border` + accent hover
- `TableOfContents` — `rounded-xl border-border`, accent hover on summary
- `Link.astro` — `decoration-accent/40` underline, `hover:text-accent`
- `PageFind.astro` — `bg-surface border-border` container, pagefind UI vars
  updated to warm palette
- Auth forms (`AuthStatus`, `SignInForm`, `SignUpForm`) — `border-border` inputs,
  `bg-accent text-ink` primary buttons
- `AdminUsers`, `CommentsSection` — `border-border bg-surface/40` cards,
  `bg-accent text-ink` submit buttons
- `prose img` — `rounded-xl` via `prose-img:rounded-xl`

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

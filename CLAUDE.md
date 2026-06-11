# CLAUDE.md

Guidance for Claude Code when working in **the-cassettas-blog-v2**.

## What this is

The Cassettas Blog: a bilingual (IT/EN) Astro blog deployed on **Vercel** as a
hybrid site — content is prerendered, dynamic features run as SSR routes.
Besides the 104 markdown posts (52 IT + 52 EN) it has:

- Per-post **comments** with auth (React island)
- **Auth + access control** (admin / approved commenter / anonymous reader)
- **Admin panel** (`/admin`): user-approval queue + Keystatic CMS for writing posts
- **Admin email notifications** via Resend (new pending sign-ups, new comments)

Sanity checks: `npm test` (60 passing), `npm run build` (114 pages), `astro check` (0 errors).

## Gotchas that aren't obvious from the code

- **No admin bootstrap UI** (by design — the first admin can't approve itself).
  After `db:push` + sign-up, manually set that row's `role = 'admin'` and
  `status = 'approved'` in the DB to exercise the admin panel.
- **Keystatic production setup**: `keystatic.config.ts` uses `github` storage in
  production. Before using the CMS in production you must:
  1. Create a **GitHub App** (not a classic OAuth App), callback URL
     `https://your-site/api/keystatic/github/oauth/callback`, with read & write
     permission on repository **Contents**, and install it on the repo.
     Easiest: temporarily set `kind: 'github'` locally and visit
     `/keystatic/setup` — Keystatic creates the app and writes its env vars to `.env`.
  2. Add `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET` and
     `KEYSTATIC_SECRET` (random, ≥32 chars — `/api/keystatic/github/login` 500s
     without it) to the Vercel env vars, then **redeploy** (env changes don't
     apply to existing deployments).
  3. In local dev the config uses `local` storage — no GitHub credentials needed.
  4. `security.allowedDomains` in `astro.config.mjs` must list every domain the
     site is served from. Since Astro 5.14, unlisted hosts make SSR requests see
     a `localhost` origin, so Keystatic sends `redirect_uri=https://localhost/…`
     to GitHub, which rejects it ("redirect_uri is not associated").
- **Keystatic image uploads** store files in `public/uploads/` (committed to the
  repo in GitHub mode, written locally in local mode). They are served at
  `/uploads/<filename>` and bypass Astro's image optimization pipeline.

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
| Email | Resend HTTP API via plain `fetch` (`src/lib/notifications.ts`, no SDK) |
| Class utils | `clsx` + `tailwind-merge` |

**Pinned versions** (latest majors require Astro 6; we're on Astro 5.18):
`@astrojs/vercel@9.0.5`, `@astrojs/mdx@^4.3.6`, `astro-pagefind@^1.8.6`
(astro-pagefind v2 rewrote the `Search` component on a different API — pinning
keeps `PageFind.astro` unchanged).

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
- `/keystatic/**` (admin-gated CMS UI)

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

## Email notifications

`src/lib/notifications.ts` emails the admin on two events: a new sign-up
landing in the approval queue (hooked in `src/lib/auth.ts`) and a new comment
(`/api/comments` POST). Email builders are pure, unit-tested functions;
`sendAdminNotification` is the only side-effecting piece — it **no-ops when
`RESEND_API_KEY` or `NOTIFY_EMAIL_TO` is unset and never throws**, so a
notification failure can never break sign-up or comment posting.

## Database (Neon / Postgres, via Drizzle)

- Better Auth owns `user` (custom `role` + `status` additionalFields, `status`
  default `pending`, `input: false`), `session`, `account`, `verification`.
- Custom `comment` table: `id`, `post_id` (e.g. `"post-00042"`), `language`
  (`it`/`en`), `user_id`, `content`, `created_at`. **No status column** — every
  comment from an approved user shows immediately.

## Content conventions

- Posts: `src/content/blog/[lang]/post-XXXXX/index.md` (`it` and `en`).
- Frontmatter: `title`, `description`, `date`, optional `draft` (excluded from
  build), `language`.
- Images use relative paths; the title attribute becomes an italic caption via
  the custom remark plugin `src/lib/remark-image-captions.js`.
- `cleanSlug()` in `src/lib/utils.ts` strips language prefix + extension from IDs.
- Path aliases: `@*` → `./src/*` (e.g. `@components/Foo`, `@lib/utils`).
- Older posts use mixed image naming (`post-1`…`post-41`, then `post-00042`+) —
  preserve existing names; use the zero-padded form for new posts.

## Design system

Elegant, dark-first warm palette on a single amber/gold accent.

### Tokens (defined in `global.css` `@theme`, overridden in `.dark`)

| Token | Light | Dark | Class usage |
|---|---|---|---|
| `ink` | `#f7f4ee` | `#0c0b0a` | `bg-ink` (page background) |
| `surface` | `#efe9dd` | `#17150f` | `bg-surface` (header, footer, cards, code blocks) |
| `border` | `rgb(0 0 0 / 0.10)` | `rgb(255 255 255 / 0.10)` | `border-border` (all outlines) |
| `muted` | `#2b2620` | `#f3efe7` | CSS var only — set on `body` as body-copy color |
| `accent` | `#9c7530` | `#d8b167` | `text-accent`, `border-accent`, `bg-accent/10`, `decoration-accent` |

> `muted` is the body-copy color despite the name — it was chosen to avoid the
> awkward `text-text` Tailwind class a `text` token would produce.

### Component conventions

Keep new UI consistent with these patterns:

- Cards & interactive containers (`ArrowCard`, `PostNavigation`, `BackToTop`,
  `BackToPrevious`, `TableOfContents`) — `rounded-xl border-border`,
  `hover:bg-accent/5 hover:border-accent/30`, accent arrow strokes
- `Callout.astro` — unified `bg-surface/60` + `border-l-4` colored by type
  (gold / sky / amber / rose)
- `Header` / `Footer` buttons — `border-border` + accent hover
- `Link.astro` — `decoration-accent/40` underline, `hover:text-accent`
- Forms (`SignInForm`, `SignUpForm`, `AuthStatus`, `AdminUsers`,
  `CommentsSection`) — `border-border` inputs, `border-border bg-surface/40`
  cards, `bg-accent text-ink` primary/submit buttons
- `PageFind.astro` — `bg-surface border-border` container; pagefind UI vars
  follow the warm palette
- Prose images — `rounded-xl` via `prose-img:rounded-xl`
- Code blocks — warm Shiki palette in `global.css`, `copy-code` button with
  accent hover

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
KEYSTATIC_SECRET=                   # random 32+ char string
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=   # optional, links UI to app install page
RESEND_API_KEY=                     # admin email notifications (Resend); blank = skipped
NOTIFY_EMAIL_TO=                    # admin inbox for the notifications
NOTIFY_EMAIL_FROM=                  # optional, defaults to onboarding@resend.dev
```

Never commit secrets; set production values in the Vercel dashboard.

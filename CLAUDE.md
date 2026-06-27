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
- **Email verification** via Resend (email/password sign-ups must verify before sign-in)

Sanity checks: `npm test` (88 passing), `npm run build` (114 pages), `astro check` (0 errors).

## Gotchas that aren't obvious from the code

- **No admin bootstrap UI** (by design — the first admin can't approve itself).
  After `db:push` + sign-up, manually set that row's `role = 'admin'` and
  `status = 'approved'` in the DB to exercise the admin panel.
- **Keystatic is local-first**: `keystatic.config.ts` uses `kind: 'local'`
  unconditionally (no GitHub storage). Authoring happens locally via
  `npm run dev` → `/keystatic`, which writes straight into the working tree; you
  then review, commit and push by hand. The deployed `/keystatic` can't persist
  changes (Vercel's serverless filesystem is ephemeral) — don't author there.
  Because there's no GitHub storage, the `KEYSTATIC_GITHUB_*` env vars and a
  GitHub App are no longer needed.
- **New posts are `.md`, not `.mdoc`**: the content field is
  `fields.mdx({ extension: 'md' })`. Keystatic's rich-text fields otherwise emit
  Markdoc (`.mdoc`), which the Astro loader (globbing `**/*.{md,mdx}` in
  `src/content.config.ts`) ignores — so such posts silently never render.
- **Keystatic post folders are slug-named**: `slugField: 'title'` derives the
  `*/index` folder name from the title (e.g. `my-post-title/`), not the
  `post-XXXXX` convention. To match existing posts, set the **Slug** field
  manually (e.g. `post-00053`) when creating a post — Keystatic has no
  auto-increment.
- **Keystatic images co-locate with the post — via `directory`, not by omitting
  it**: the content field's image config sets
  `directory: 'src/content/blog/{lang}'` (and leaves `publicPath` unset), so
  uploads land beside the post's `index.md` and are referenced relatively (e.g.
  `![](pic-1.jpg)`) — going through Astro's image optimization pipeline like the
  relative images in hand-written posts. The two options are independent:
  `directory` controls the on-disk write (Keystatic stores at
  `{directory}/{slug}/{filename}`, and the slug is the post folder, so the file
  lands next to `index.md`); `publicPath` controls the markdown reference (unset
  → bare `pic-1.jpg`). **Don't omit `directory`** — because the collection path
  ends in `/index`, an unset `directory` makes Keystatic nest the upload at
  `{slug}/index/content/pic-1.jpg`, which the bare reference can't resolve →
  `[ImageNotFound] Could not find requested image pic-1.jpg` and the post page
  fails to build/render.

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
| CMS | Keystatic (`@keystatic/core` + `@keystatic/astro`), local storage |
| Image upload | Keystatic, co-located beside the post (Astro image pipeline) |
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
- `/api/admin/users/[id]` (PATCH/DELETE, admin-only) + `/admin/**` pages
- `/keystatic/**` (admin-gated CMS UI)

Everything under `/it/` and `/en/` is prerendered, including the sign-in/sign-up
pages (auth runs client-side via the API route).

## Auth & access model

- **Admin**: Keystatic access + user-approval queue.
- **User**: signs up as `status: 'pending'`, **cannot sign in until an admin
  approves**. Once approved, comments post immediately (no per-comment moderation).
- **Anonymous**: read posts and comments only.
- **Introduction gate** (anti-spam): every sign-up must say how they know the
  admin. Email sign-ups send it in the request body (validated in the
  before-hook). Google sign-ups go through SignUpForm's **Google mode**
  (`?google=1`, or clicking the Google button): a reduced form with just name +
  introduction whose submit stashes both in short-lived cookies
  (`google_signup_introduction`, `google_signup_name`) and launches OAuth; the
  `user.create.before` database hook reads them back onto the new row — or
  refuses creation, surfacing `?error=INTRODUCTION_REQUIRED`. A brand-new
  Google user hitting the sign-in page's Google button is auto-redirected to
  `/{lang}/sign-up?google=1`. Shared helpers live in `src/lib/introduction.ts`.
- A `databaseHooks.session.create.before` hook throws `APIError('FORBIDDEN')`
  when `status !== 'approved'` — one gate covering both email/password and Google.
  The check is extracted as a pure, unit-tested function in `src/lib/auth-approval.ts`.
- **Email verification** (independent of admin approval — both gates must pass):
  email/password sign-ups can't sign in until they click the emailed link
  (`requireEmailVerification`); a blocked sign-in attempt re-sends the link
  (`sendOnSignIn`), which doubles as the "resend" path. Google accounts arrive
  verified. The verify link lands on `/{lang}/sign-in?verified=1` (success) or
  appends `?error=TOKEN_EXPIRED|INVALID_TOKEN` (mapped to friendly strings in
  `SignInForm`).
- **Account linking**: a Google sign-in attaches to an existing email/password
  user with the same address (`account.accountLinking` + `trustedProviders:
  ["google"]` in `src/lib/auth.ts`) — but only after the local email is
  verified (Better Auth's `requireLocalEmailVerified` default). Without
  linking enabled, Google login fails with `account_not_linked` for anyone
  who registered through the email form.
- **Deleting a user is not a ban**: the admin panel's delete fully removes the
  account (sessions, accounts and comments go with it via `onDelete: 'cascade'`),
  so the same email can sign up again and land back in the pending queue. If a
  "blocked" state is ever needed, implement it as a status change, not a delete.
  Admin accounts can't be deleted (`canDeleteUser` in `src/lib/admin.ts`).
- `src/middleware.ts` enforces route guards on `/admin` + `/keystatic` (pages
  redirect/403); `/api/admin/**` self-guards with JSON 401/403. Sessions via
  Better Auth HTTP-only cookies.

## Email (notifications + verification)

`src/lib/notifications.ts` sends all mail through the Resend HTTP API:
admin notifications on two events (a new sign-up landing in the approval
queue, hooked in `src/lib/auth.ts`, and a new comment via `/api/comments`
POST) plus two user-facing emails: the **verification email** on
email/password sign-up, and the **account-approved email** sent by the admin
PATCH route (`/api/admin/users/[id]`) when a user's status transitions to
`approved` — any sign-up method, and only on the actual transition.
Email builders are pure, unit-tested functions; `sendEmail` is the only
side-effecting piece — it **no-ops when `RESEND_API_KEY` is unset and never
throws**, so a mail failure can never break sign-up or comment posting.
When a verification email can't be sent, the link is logged server-side
(`[auth] verification email NOT sent…`) so the flow stays completable.

**Deliverability gotcha**: the default `onboarding@resend.dev` sender only
delivers to the Resend account owner — fine for admin notifications, useless
for verification emails to real users. Production needs `NOTIFY_EMAIL_FROM`
set to an address on a domain verified in Resend.

## Database (Neon / Postgres, via Drizzle)

- Better Auth owns `user` (custom `role` + `status` additionalFields, `status`
  default `pending`, `input: false`), `session`, `account`, `verification`.
- Custom `comment` table: `id`, `post_id` (e.g. `"post-00042"`), `language`
  (`it`/`en`), `user_id`, `content`, `created_at`. **No status column** — every
  comment from an approved user shows immediately. Comments are shared across
  languages: GET filters by `post_id` only, so a comment appears on both the IT
  and EN version of a post; `language` just records where it was written
  (used in the admin notification).

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
- **Translating IT → EN**: posts are written in Italian first; the
  `/translate-post` skill (`.claude/skills/translate-post/SKILL.md`) mirrors one
  into English. Run `/translate-post post-XXXXX` — it reads
  `blog/it/post-XXXXX/index.md` and writes `blog/en/post-XXXXX/index.md` (same
  folder name, same shared image paths) as an idiomatic translation: translates
  `title`/`description`, image alt text and `"caption"` titles; keeps `date`/
  `draft`; sets `language: "en"`; preserves all other Markdown. Images aren't
  copied (they're shared assets). It doesn't build or commit — review the diff
  and commit both folders by hand.

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
RESEND_API_KEY=                     # all outgoing email (Resend); blank = skipped, verify links logged instead
NOTIFY_EMAIL_TO=                    # admin inbox for the notifications
NOTIFY_EMAIL_FROM=                  # sender; must be a verified-domain address for user-facing verification emails
```

Never commit secrets; set production values in the Vercel dashboard.

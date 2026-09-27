# Book Tracker

Track how far you are through several books at once, and always know the page to
resume from. See [PLAN.md](./PLAN.md) for the v1 scope, data model and design
references.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript strict) |
| Auth | Better Auth 1.7 — users live in our own Postgres |
| Database | Neon Postgres + Drizzle ORM |
| UI | Tailwind CSS v4 + shadcn/ui (Radix), Lucide icons |
| Validation | Zod 4 + react-hook-form |
| Client data | TanStack Query 5 — SSR prefetch + hydration, optimistic mutations |
| Tests | Vitest (domain math) |

## Browser support

The floor is **Safari 15.6 / iOS 15.8** — an iPhone 7 Plus, the oldest device
this is actually used on. Next.js 16 targets Safari 16.4 by default, which is
newer than that phone can ever run, so `package.json` carries an explicit
`browserslist`:

```json
"browserslist": ["chrome 111", "edge 111", "firefox 111", "safari 15.6", "ios_saf 15.6"]
```

Two separate things can break an older browser, and that setting only fixes the
first:

- **Syntax it cannot parse.** One class static block in a chunk is a
  `SyntaxError`, the chunk never runs, and *nothing* on the page is interactive
  — with no error visible to the person holding the phone. Lowering the target
  makes the compiler rewrite it.
- **Methods it does not have.** Down-levelling never adds those.
  `src/instrumentation-client.ts` polyfills them; today that is
  `Array.prototype.toSorted` (Safari 16.4), which every Radix dropdown, select
  and tab list calls.

`pnpm check:legacy-safari` scans the built chunks for both and fails if
something new creeps in. Run it after `pnpm build`.

What that phone still does not get, all cosmetic: `color-mix()` (Safari 16.2),
so `/30`-style opacity variants fall back to the solid colour — Tailwind emits
the fallback and an `@supports` guard automatically; `@property` (16.4), which
only affects animated custom properties; and two `@container` rules (16.0).

## Getting started

```bash
pnpm install
cp .env.example .env.local     # then fill in DATABASE_URL
openssl rand -base64 32        # -> BETTER_AUTH_SECRET
pnpm db:migrate                # apply drizzle/*.sql
pnpm dev
```

Open http://localhost:3000, create an account, and add a book.

To get some data to look at:

```bash
pnpm db:seed you@example.com   # the address you signed up with
```

## Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon pooled connection string |
| `BETTER_AUTH_SECRET` | yes | ≥32 chars, `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | yes | `http://localhost:3000` in development |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Google sign-in appears only when both are set |

> **Deploying:** `BETTER_AUTH_URL` must be the deployed origin, not `localhost`.
> Better Auth trusts only that origin, so a production deployment still pointing
> at localhost fails every sign-in with **"Invalid origin"**. Vercel's own
> `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_URL` are added automatically in
> `src/lib/auth.ts`, which covers preview deployments.

Values are validated in `src/lib/env.ts` at build time — a missing variable fails
`next build` rather than the first request.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and serve |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm db:generate` | Generate SQL from the Drizzle schema |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Push schema straight to the DB (development only) |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm db:seed <email>` | Sample books and sessions for an existing account |
| `pnpm db:backfill-catalogue` | Link existing shelf books to catalogue entries (idempotent) |
| `pnpm auth:generate` | Regenerate the Better Auth tables (see note below) |
| `pnpm admin:promote <email> [role]` | Grant `user`, `admin` or `superadmin` |

## Layout

```
src/
  app/
    (auth)/           sign-in, sign-up
    (app)/            library, books, stats, settings — guarded by requireUser()
    api/auth/[...all] Better Auth handler
  proxy.ts            Next 16 route protection (optimistic; not the real gate)
  db/schema/          auth.ts (generated) + books.ts (domain)
  modules/            feature-first: schema.ts, queries.ts, actions.ts, components/
  lib/                auth, session, safe-action, env, format
```

### Conventions

- **Reads** are Server Components calling `modules/*/queries.ts` directly.
- **Writes** are Server Actions wrapped in `authedAction` (`src/lib/safe-action.ts`),
  which resolves the session server-side, validates with Zod, and injects `userId`.
  A client-supplied `userId` is never trusted.
- **Every** query and mutation is scoped by `userId`. That is the multi-tenant
  boundary, and it is enforced in the data layer, not the UI.
- `proxy.ts` only does an optimistic cookie check so signed-out visitors don't see
  a flash of app chrome. Real enforcement is `requireUser()` and `authedAction`.
- Logging progress writes `reading_session` and `book.current_page` in one
  transaction — see `src/modules/progress/actions.ts`.

### A note on `pnpm auth:generate`

`@better-auth/cli` currently publishes 1.4.x while the library is on 1.7.x, and its
output omits `account.issuer`, which 1.7 requires. If you regenerate
`src/db/schema/auth.ts`, re-add that column — the file carries a comment marking it.

## Data flow and performance

- **Reads**: each app page prefetches its query on the server
  (`src/lib/query/prefetch.tsx`) and hydrates it into TanStack Query. The same
  loader (`modules/books/loaders.ts`) backs the JSON routes the client refetches
  from, so hydrated and refetched data can never differ in shape. Dates travel
  as ISO strings (`modules/books/dto.ts`) — never Date objects, and never the
  space-separated Postgres format Safari's parser rejects.
- **The shelf is one query.** Tabs, counts and "Continue reading" derive from it
  on the client (`modules/books/library.ts`), so switching tabs is instant.
- **Writes are optimistic** (`modules/books/use-book-mutations.ts`): the cache
  updates on tap, rolls back on refusal, and reconciles afterwards. The pure rules
  they apply mirror the server's and are unit-tested against them.
- **Delete has Undo.** The book leaves the UI at once; the server delete is sent
  only after the 5s window. Closing the tab inside the window keeps the book.
- **Navigation**: sidebar links fully prefetch; book rows prefetch on intent
  (hover, focus, touch). No route-level `loading.tsx` — measured, a skeleton
  *delayed* content, because React holds content until a shown fallback has
  been visible ~300ms. Unprefetched links show `LinkPendingBar` instead.
- **Server caching**: the landing page is static (CDN); catalogue search is
  cached across all readers with `unstable_cache` and expired by tag on writes.
- **React Compiler** is on (`reactCompiler: true`).

`BETTER_AUTH_URL` still needs to be the deployed origin — see Environment.

## Shared book catalogue

Every book anyone adds joins `book_edition`, a shared catalogue. When the next
person types a title, matches are suggested so nobody retypes a book that
already exists.

- **Search** is `pg_trgm` trigram matching over a GIN index, so `powr brokr`
  finds *The Power Broker*. `ILIKE %term%` catches substrings and the `%`
  operator catches typos; both are served by the same index.
- **Identity** is `(normalized_title, normalized_author)` with a unique index.
  `normalizeTitle` lowercases, strips punctuation and ignores a leading article,
  so "The Hobbit" and "hobbit" collide. It keeps Unicode **marks** (`\p{M}`),
  without which Bengali vowel signs are stripped and titles are destroyed.
- **The shelf keeps its own copy** of title/author/totalPages. Two readers can
  own different editions with different page counts, and a shared page count
  would corrupt their progress maths. `book.editionId` is a nullable link, set
  null on delete — losing a catalogue row must never take reading history with it.
- **`usage_count`** (the ranking key) is maintained by a database trigger, not
  application code. Deleting a *user* cascades to their books without running any
  application path, so an app-maintained counter drifts upward forever.

The suggestion box (`modules/catalogue/components/title-combobox.tsx`) debounces
the query by 250 ms, aborts in-flight requests, and derives both the visible
results and the loading flag from state rather than clearing them in an effect —
so results from an earlier query can never linger under a newer one.

Run `pnpm db:backfill-catalogue` once after deploying to seed the catalogue from
books that already exist.

## Attaching your own copy

A book can carry a link to the reader's actual copy — a PDF, an EPUB, a Drive
file, a web reader. It shows as "Open file" on the book page and as a small icon
in the library row, and opens in a new tab.

- **It is private.** `file_url` lives on `book`, never on the shared
  `book_edition`: these URLs are usually account-bound, and the catalogue is
  visible to every other reader. Picking a catalogue suggestion fills the title,
  author, page count and cover, and deliberately leaves the file link alone.
- **http(s) only.** The value is rendered as an `href`, so `javascript:` and
  `data:` are refused rather than sanitised. One rule (`optionalUrl` in
  `modules/books/schema.ts`) covers both the file link and the cover URL, on the
  server and in the form.
- **One component.** `BookFileLink` renders it everywhere, as a plain `<a>` with
  `rel="noopener noreferrer"`.

## Back office

`/admin` is staff-only, linked in the sidebar for staff and hidden otherwise.

| Role | Can |
|---|---|
| `user` | Nothing administrative |
| `admin` | View metrics and accounts, ban/unban, revoke sessions, impersonate a **member** |
| `superadmin` | All of the above, plus change roles, set passwords, delete accounts, and act on other admins |

The first super admin has to be created from the command line — the back office
is staff-only, so there is no way to bootstrap one from inside it:

```bash
pnpm admin:promote you@example.com superadmin
```

Everything after that can be done from `/admin`.

**Two rules enforced in `modules/admin/actions.ts`, not just hidden in the UI:**

- Only a super admin may change roles, set someone's password, or delete an
  account. Setting a password is *narrower* than Better Auth's own default,
  which grants `user: ["set-password"]` to the built-in admin role: it is a
  permanent account takeover, unlike impersonation, which is time-boxed and
  recorded.
- Staff may not ban, unban or revoke sessions of other staff — only a super
  admin may. Better Auth gates *impersonating* an admin behind its own
  permission but has no equivalent for banning, so without this a plain admin
  could ban the owner and lock them out.

## Passwords

| Who | Where | Needs |
|---|---|---|
| Anyone | `/settings` → Password | Their current password |
| Anyone who signed up with Google | `/settings` → Password | Nothing — the live session is the proof, and they gain email sign-in |
| Super admin, for any account | `/admin` → ⋯ → Set password… | Nothing; **Generate** makes a strong one |
| Whoever holds the server | `pnpm admin:set-password <email>` | Shell access |

```bash
pnpm admin:set-password you@example.com              # asks twice, hidden
pnpm admin:set-password you@example.com --generate   # prints a strong one
pnpm admin:set-password you@example.com --keep-sessions
```

The CLI exists for the one person the in-app reset can't help: a locked-out
super admin, who has no session to reset from. It hashes through Better Auth's
own context, so a password it writes verifies at sign-in like any other, and it
adds email sign-in to a Google-only account if there was no password before.

Every reset signs the account out everywhere by default — a reset that leaves
old sessions alive locks nobody out. Changing your own password keeps *this*
device signed in and drops the others.

There is no "forgot password" email: this deployment has no mail transport.
Wire one up and Better Auth's `requestPasswordReset` becomes the fourth row in
that table.

Revocation is not instant. A session is read from its signed cookie for
`session.cookieCache.maxAge` (60 seconds, in `lib/auth.ts`) before the database
is consulted again, so a revoked device can keep working for up to a minute.
Lower it to 0 to make bans and resets immediate, at one session lookup per
request.

Impersonation is deliberately conspicuous: the session records `impersonatedBy`,
sessions last 30 minutes, and a red banner sits above the app until you stop.


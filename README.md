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
| Tests | Vitest (domain math) |

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

## Back office

`/admin` is staff-only, linked in the sidebar for staff and hidden otherwise.

| Role | Can |
|---|---|
| `user` | Nothing administrative |
| `admin` | View metrics and accounts, ban/unban, revoke sessions, impersonate a **member** |
| `superadmin` | All of the above, plus change roles, delete accounts, and act on other admins |

The first super admin has to be created from the command line — the back office
is staff-only, so there is no way to bootstrap one from inside it:

```bash
pnpm admin:promote you@example.com superadmin
```

Everything after that can be done from `/admin`.

**Two rules enforced in `modules/admin/actions.ts`, not just hidden in the UI:**

- Only a super admin may change roles or delete an account.
- Staff may not ban, unban or revoke sessions of other staff — only a super
  admin may. Better Auth gates *impersonating* an admin behind its own
  permission but has no equivalent for banning, so without this a plain admin
  could ban the owner and lock them out.

Impersonation is deliberately conspicuous: the session records `impersonatedBy`,
sessions last 30 minutes, and a red banner sits above the app until you stop.


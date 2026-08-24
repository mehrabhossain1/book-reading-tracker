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
| `pnpm auth:generate` | Regenerate the Better Auth tables (see note below) |

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

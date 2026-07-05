# Fix incorrect DATABASE_URL guidance — runtime app needs the transaction pooler, not the direct connection

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `docs/fix-database-url-pooler-guidance` |
| **Depends on** | none |

---

## Problem

`.env.example` currently says:

```bash
# Database — used by Drizzle Kit for migrations only (never exposed to the app)
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
```

Both parts of this are wrong for the deployed app:

1. **"Used by Drizzle Kit for migrations only (never exposed to the app)" is false.** `packages/db/src/index.ts` — the module every `SupabaseDataClient` call imports — reads `DATABASE_URL` directly and uses it for all runtime queries:

   ```ts
   const connectionString = process.env.DATABASE_URL!
   // Disable prefetch as it is not supported for "Transaction" pool mode
   const client = postgres(connectionString, { prepare: false })
   export const db = drizzle(client, { schema })
   ```

2. **The example value is a direct connection string** (`db.<ref>.supabase.co:5432`), which only resolves via IPv6. Vercel's serverless functions can't route IPv6, so any deployed environment configured with a direct-connection `DATABASE_URL` fails at runtime with `ENOTFOUND` on every request that touches the database — this just happened on the new staging environment (handoff 039).

The `{ prepare: false }` config in `index.ts` is itself evidence the app was always meant to run against Supabase's **Transaction pooler** — prepared statements aren't supported in that pool mode, which is exactly why that flag exists. The `.env.example` guidance simply never matched what the code expects.

---

## Background

This is a real, reproducible outage-class bug, not a style nit — it took down the entire staging environment (every page that touches the DB) the first time someone followed `.env.example` as written. Production likely already has the correct pooler connection string configured directly in Vercel (since it works), which is exactly why this gap was invisible until a second environment was set up from the documented example.

---

## Affected files

- `.env.example` — fix comment and example value
- `docs/ARCHITECTURE.md` §17 (Environment Configuration) — `DATABASE_URL` isn't listed in the main env var reference block at all; add it with correct guidance
- `packages/db/drizzle.config.ts` — add a clarifying comment (this file's `DATABASE_URL` usage is the one case that legitimately wants a direct connection, since it's a local CLI tool, not the deployed runtime)

---

## Implementation steps

1. **Fix `.env.example`**

   Replace:

   ```bash
   # Database — used by Drizzle Kit for migrations only (never exposed to the app)
   DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
   ```

   With:

   ```bash
   # Database — used both by Drizzle Kit (migrations, run locally) AND by the
   # running app at request time (packages/db/src/index.ts, via getDataClient()).
   #
   # For any DEPLOYED environment (Vercel — staging or production): this MUST be
   # the Supabase "Transaction pooler" connection string, not the direct
   # connection. The direct connection host (db.<ref>.supabase.co) only resolves
   # via IPv6, which Vercel's serverless functions cannot route — using it here
   # breaks every page that touches the database with a DNS ENOTFOUND error.
   # Copy the Transaction pooler string exactly from the Supabase dashboard's
   # Connect panel — don't hand-edit it, the pooler username format differs
   # (postgres.<project-ref>, not just postgres).
   #
   # Locally, for running `pnpm --filter @grassroots/db db:push`/`db:generate`
   # from your own machine, the direct connection is fine and simpler — that's
   # a different execution context than Vercel's functions.
   DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-0-your-region.pooler.supabase.com:6543/postgres
   ```

   Commit: `fix(docs): correct DATABASE_URL guidance — deployed environments need the transaction pooler`

2. **Add `DATABASE_URL` to `docs/ARCHITECTURE.md` §17's env var block**

   It's currently missing from the main reference block entirely. Add it under the `# Supabase` group:

   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=        # Server-side only — NEVER expose to client
   DATABASE_URL=                     # Transaction pooler string in any deployed environment (Vercel) — direct connection is IPv6-only and breaks on Vercel's functions. Direct connection is fine for local Drizzle Kit CLI use only.
   ```

   Also update the "Staging environment configuration" subsection (added by handoff 039) to state explicitly that `DATABASE_URL` for the staging Vercel environment must be the transaction pooler string, same as production.

   Commit: `docs: add DATABASE_URL to environment configuration reference with pooler guidance`

3. **Add a clarifying comment to `packages/db/drizzle.config.ts`**

   ```ts
   import { defineConfig } from 'drizzle-kit';

   // This file is only used by the Drizzle Kit CLI (db:push / db:generate),
   // run locally from a developer's machine — never by the deployed app.
   // DATABASE_URL here can safely be the direct connection string. Do not
   // confuse this with the DATABASE_URL used by packages/db/src/index.ts at
   // app runtime, which must be the transaction pooler string in any
   // deployed (Vercel) environment — see .env.example.
   export default defineConfig({
     schema: './src/schema.ts',
     out: './drizzle',
     dialect: 'postgresql',
     dbCredentials: {
       url: process.env.DATABASE_URL!,
     },
   });
   ```

   Commit: `docs: clarify drizzle.config.ts's DATABASE_URL is CLI-only, distinct from runtime usage`

---

## Verification

- [ ] `.env.example`'s `DATABASE_URL` comment no longer claims it's migration-only or "never exposed to the app."
- [ ] `.env.example`'s example `DATABASE_URL` value uses the pooler hostname format (`*.pooler.supabase.com:6543`), not the direct `db.*.supabase.co:5432` format.
- [ ] `docs/ARCHITECTURE.md` §17 lists `DATABASE_URL` in the main env block with the pooler guidance.
- [ ] `drizzle.config.ts` has the clarifying comment.
- [ ] `pnpm type-check` passes (comment-only changes to `drizzle.config.ts`, no behavior change).

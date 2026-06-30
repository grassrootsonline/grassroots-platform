# 020 — Supabase production bootstrap: wire the app to a real backend

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `feat` |
| **Branch** | `feature/supabase-bootstrap` |
| **Depends on** | 012, 018, 019 — all auth/backend work must be merged to `development` first |

---

## Context

The Supabase project does not exist yet. All backend work to date (012, 018, 019) was written to the correct API surface but has never been run against a live Supabase instance. This handoff covers everything needed to make the app boot and function against a real Supabase project.

**This handoff has a prerequisite Alex must complete before Claude Code starts:**

> 1. Create a new Supabase project at supabase.com.
> 2. Note the **Project URL** and **anon public key** from Project Settings → API.
> 3. Note the **service role key** from the same page (keep this secret — it bypasses RLS).
> 4. Note the **database connection string** (direct, not pooled) from Project Settings → Database → Connection string → URI.
> 5. Enable **email auth** in Authentication → Providers → Email. Leave "Confirm email" on.
> 6. Optionally enable **Google OAuth** in Authentication → Providers → Google (requires a Google Cloud OAuth app). This can be deferred — the signup flow works with email only.
> 7. Set the **site URL** in Authentication → URL Configuration to the Vercel production URL.
> 8. Add the following to the **Redirect URLs** allowlist in the same panel:
>    - `https://yourdomain.com/auth/callback` (production — replace with the real domain)
>    - `https://grassroots-platform-*.vercel.app/auth/callback` (covers all PR preview deployments via wildcard — confirm the prefix matches your actual Vercel preview URL format before saving)

Once Alex has the credentials, Claude Code proceeds with the steps below.

---

## Scope

1. Create `.env.local` with the correct variable names and placeholder documentation.
2. Add `.env.local` to `.gitignore` (verify it is already there — do not duplicate).
3. Verify and update `lib/supabase/client.ts` and `lib/supabase/server.ts` to read the env vars correctly.
4. Run Drizzle migrations against the Supabase Postgres instance.
5. Verify the `USE_SEED_DATA` flag is wired correctly in `getDataClient()`.
6. Add required environment variables to Vercel (documented in the verification section — Alex does this step).

---

## Affected files

- `.env.local` (create — local only, never commit)
- `.env.example` (create — committed, no real secrets, documents required vars)
- `.gitignore` — verify `.env.local` is already excluded; add it if not
- `lib/supabase/client.ts` — verify env var names match
- `lib/supabase/server.ts` — verify env var names match
- `apps/web/.env.local` (if the app uses a nested env file — check actual layout first)

Do not touch schema files, actions, or any other files. If migration commands fail due to a schema mismatch, stop and report the error to Alex rather than attempting to modify the schema.

---

## Environment variable specification

The following vars are required. Use exactly these names — they are already referenced in `lib/supabase/`.

```bash
# .env.local — never commit this file

# Supabase — public (safe to expose to the browser)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>

# Supabase — server-only (never prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Database — used by Drizzle Kit for migrations only (never exposed to the app)
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres

# Data layer switch
# Set to "true" on development/feature branches (seed data, no live services)
# Set to "false" on main (live Supabase)
USE_SEED_DATA=false
```

---

## Implementation steps

**Step 1 — Create `.env.example`**

Create `.env.example` at the repo root. This file is committed and serves as the canonical record of what environment variables the app needs. Use placeholder values — never real credentials.

```bash
# .env.example — copy to .env.local and fill in real values
# Never commit .env.local

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
USE_SEED_DATA=false
```

Commit: `chore: add .env.example with required variable names`

---

**Step 2 — Verify `.gitignore`**

Open `.gitignore` at the repo root. Confirm `.env.local` and `.env*.local` are excluded. If either line is missing, add it under the environment variables section.

If `.gitignore` already has the correct exclusions, make no change (and no commit for this step).

Commit (only if a change was needed): `chore: ensure .env.local is excluded from git`

---

**Step 3 — Verify Supabase client files**

Read `lib/supabase/client.ts` and `lib/supabase/server.ts`. Confirm they read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `process.env`. If the variable names differ from the specification above, update them to match.

The browser client (`client.ts`) should use `createBrowserClient` from `@supabase/ssr`. The server client (`server.ts`) should use `createServerClient` from `@supabase/ssr` with the Next.js cookie adapter.

If the files already match the spec and use the correct `@supabase/ssr` API, make no change.

Commit (only if changes were needed): `fix: align Supabase client env var names with .env.example`

---

**Step 4 — Run Drizzle migrations**

With `.env.local` populated and `DATABASE_URL` pointing to the Supabase Postgres instance, run:

```bash
pnpm drizzle-kit push
```

or if the project uses migration files (check `drizzle.config.ts` to confirm):

```bash
pnpm drizzle-kit migrate
```

If the command fails, **stop and report the full error output to Alex.** Do not attempt to resolve schema conflicts by modifying existing migration files.

If the command succeeds, verify in the Supabase dashboard (Table Editor) that the `users`, `user_profiles`, `user_roles`, and `waitlist_entries` tables (and any others defined in `packages/db/`) exist.

No commit for this step — it is a runtime operation, not a file change.

---

**Step 5 — Verify `getDataClient()` env flag**

Read the `getDataClient()` implementation (likely in `lib/data/client.ts` or similar). Confirm:

- When `USE_SEED_DATA=true`, it returns the `SeedDataClient`
- When `USE_SEED_DATA=false` (or unset), it returns the `SupabaseDataClient`
- The guard is a `process.env.USE_SEED_DATA` check, not a hardcoded value

If the implementation already matches this contract, make no change.

Commit (only if a change was needed): `fix: verify getDataClient reads USE_SEED_DATA from env`

---

**Step 6 — Smoke-test on a preview deployment**

Push the branch to trigger a Vercel preview. With the preview environment variables set (see the Vercel table at the bottom of this handoff) and `USE_SEED_DATA=false`, verify against the preview URL:

- The dev banner ("Development build · seeded data") does **not** appear
- The landing page loads
- The signup form submits and creates a user in the Supabase Auth dashboard
- The check-email page displays after signup
- Email confirmation link (received in inbox) redirects to `/auth/callback` and then to `/waitlisted`

No commit for this step.

---

## Verification

- [ ] `.env.example` committed to repo root with all five variable names
- [ ] `.env.local` is excluded by `.gitignore` and does not appear in `git status`
- [ ] `lib/supabase/client.ts` reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `lib/supabase/server.ts` reads the same public vars via `@supabase/ssr` cookie adapter
- [ ] Drizzle migrations applied successfully — tables visible in Supabase Table Editor
- [ ] `getDataClient()` returns `SupabaseDataClient` when `USE_SEED_DATA` is not `"true"`
- [ ] Dev banner absent when `USE_SEED_DATA=false`
- [ ] Full signup → check-email → verify → waitlisted flow completes end-to-end against live Supabase
- [ ] No secrets appear in any committed file (`git log --all -- '*.env*'` returns only `.env.example`)

---

## Vercel environment variables (Alex's task — not Claude Code)

After this branch is pushed, Alex should add the following to the Vercel project (Settings → Environment Variables), scoped to **Production** and **Preview** environments as noted:

| Variable | Production | Preview |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | live project URL | same or a staging project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | live anon key | corresponding key |
| `SUPABASE_SERVICE_ROLE_KEY` | live service role key | corresponding key |
| `DATABASE_URL` | live DB connection string | corresponding string |
| `USE_SEED_DATA` | `false` | `true` (previews use seed data) |

The Vercel deployment will fail or produce auth errors until these are set.

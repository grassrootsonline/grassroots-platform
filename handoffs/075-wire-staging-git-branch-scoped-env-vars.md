# Fix staging deployment via git-branch-scoped Preview environment variables

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/staging-env-vars` |
| **Depends on** | none |

---

## Problem

`staging` has been non-operational since 2026-07-04 (`docs/ARCHITECTURE.md`'s callout, handoff 039's status history) — the Supabase project (`ralyzsuobkrgfgpkcchs`, "grassroots-mimic") is provisioned and its schema is applied, but the Vercel↔Supabase environment variable wiring for the `staging` branch never worked end-to-end.

Re-verified today (2026-07-14) before writing this handoff, so this isn't working from a stale assumption:

- **Schema parity is fine.** `list_migrations` against both Supabase projects returns the identical 7 migrations by name and order (`add_account_status` through `add_board_cards`) — staging is current. Nothing to fix on the database side.
- **The root cause is exactly what `ARCHITECTURE.md` already documents:** staging needs its own `DATABASE_URL` (transaction pooler, not direct — direct is IPv6-only and breaks on Vercel Functions), `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, scoped to the `staging` branch specifically and distinct from production's. If these are currently set as shared "Preview" environment variables (covering every `feature/*` branch and `staging` alike), that's the likely failure mode — `feature/*`/`development` previews are seeded (`USE_SEED_DATA=true`) and need no real credentials at all, while `staging` needs real ones; one shared Preview env set can't satisfy both.

`docs/VERCEL-BEST-PRACTICES.md` (§3) already identified the fix and is the basis for this handoff: Vercel supports **git-branch-scoped** Preview environment variables, which let `staging` have its own credential set that no other preview deployment sees.

---

## Background

This directly unblocks the git workflow `CLAUDE.md`/`ARCHITECTURE.md` already specify but can't currently follow: `main` (production) ← `staging` (closed testing, live, isolated Supabase project) ← `development` (integration, seeded) ← `feature/*` (seeded). Since 2026-07-04, `development` has been merging directly into `main` as an interim workaround because `staging` doesn't work — every production release has been skipping the real-backend check `staging` exists to provide. Fixing this restores that safety step.

Redis/Upstash caching (handoffs 069-072) is not part of this handoff's scope. Staging currently has no `KV_REST_API_URL`/`KV_REST_API_TOKEN` wired at all — this is not a blocker, since every cache call in `apps/web/src/lib/redis/client.ts` fails open to a normal DB query on any Redis error (missing env vars will just mean every `cacheGet` throws and falls back). Staging will run correctly, just uncached. Whether staging gets its own isolated Upstash database later is an open decision for Alex, not something to implement here.

---

## Affected files

- **Vercel dashboard / CLI** — environment variables for the `staging` git branch, Preview environment, no repo file
- `docs/ARCHITECTURE.md` — remove the "not yet operational" callout once verified working; update the staging environment configuration section to reflect the git-branch-scoped setup
- `CLAUDE.md` — restore the intended git workflow (`development` → `staging` → `main`) now that `staging` works; remove the interim `development` → `main` direct-merge language

---

## Implementation steps

### 1. Pull staging's real Supabase credentials

From the Supabase dashboard's Connect panel for `ralyzsuobkrgfgpkcchs` ("grassroots-mimic"), get:

- `DATABASE_URL` — **must be the transaction pooler string** (`aws-0-<region>.pooler.supabase.com:6543`, username `postgres.<project-ref>`), same requirement as production (handoff 063). The direct connection string is IPv6-only and breaks on Vercel Functions — this exact mistake is what broke staging originally on 2026-07-04.
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Add them as git-branch-scoped Preview env vars for `staging`

```bash
vercel env add DATABASE_URL preview --git-branch=staging
vercel env add SUPABASE_SERVICE_ROLE_KEY preview --git-branch=staging
vercel env add NEXT_PUBLIC_SUPABASE_URL preview --git-branch=staging
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview --git-branch=staging
vercel env add NEXT_PUBLIC_APP_ENV preview --git-branch=staging   # value: staging
vercel env add USE_SEED_DATA preview --git-branch=staging         # value: false
```

Confirm via `vercel env ls` that these now show as scoped specifically to the `staging` branch, not the general Preview environment — that scoping is the entire point of this fix. If any of these variable names already exist as unscoped Preview vars, decide whether to leave the unscoped ones for other `feature/*` branches (they should stay seeded, so they shouldn't have real Supabase credentials at all — check whether `NEXT_PUBLIC_APP_ENV`/`USE_SEED_DATA` are already unscoped-Preview-set to `development`/`true`, matching `feature/*`'s expectations, before touching anything there) or if there's contamination to clean up.

### 3. Redeploy `staging`

Env var changes don't apply retroactively — trigger a fresh deployment of the `staging` branch (push a no-op commit, or use the Vercel dashboard/CLI to redeploy) so it picks up the new branch-scoped variables.

### 4. Verify end-to-end

Load the `staging` deployment URL and confirm:
- No "Development build · seeded data" banner (confirms `USE_SEED_DATA=false` took effect, not the seeded path)
- Auth actually round-trips through the staging Supabase project (sign up or sign in with a test account; confirm the user shows up in `ralyzsuobkrgfgpkcchs`'s `users` table via `execute_sql`, not production's)
- No `ENOTFOUND`/pooler connection errors in `get_runtime_errors`/`get_logs` for the staging deployment

### 5. Update the docs once verified — not before

Only after step 4 passes:

- `docs/ARCHITECTURE.md` — remove the "⚠ Staging is not yet operational" callout (§ around line 458) and the "Staging environment configuration" section's "Not currently operational" line (line 523); replace with a short confirmation of what's now wired and when.
- `CLAUDE.md`'s git workflow section — remove the "Interim, while staging is paused" language and restore `development` merges into `staging` (not `main`) as the standard flow; `staging` merges into `main` only after that check passes. Update the bot-authored-PR retargeting guidance to point at `staging`, not `development`, per the doc's own "once staging is operational again" note.

Commit: `fix(env): wire staging to its own git-branch-scoped Supabase credentials` (env var change, no repo diff) followed by `docs: restore staging tier in git workflow now that it's operational` (the `ARCHITECTURE.md`/`CLAUDE.md` doc updates).

---

## Verification

- [ ] `vercel env ls` shows `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_ENV`, `USE_SEED_DATA` all scoped specifically to the `staging` git branch.
- [ ] Fresh `staging` deployment succeeds and does not render the seeded-data banner.
- [ ] A real signup/login on the staging deployment lands a row in `ralyzsuobkrgfgpkcchs`'s `users` table, confirmed via `execute_sql`, not in production's project.
- [ ] No pooler/connection errors in staging's runtime logs after redeploy.
- [ ] `feature/*` and `development` branch previews still work as seeded (unaffected by this change — confirm nothing about their env resolution changed).
- [ ] `docs/ARCHITECTURE.md` and `CLAUDE.md` updated to reflect staging is operational, only after the above all pass.

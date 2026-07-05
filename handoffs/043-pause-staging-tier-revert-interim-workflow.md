# Flag staging tier as not-yet-operational, revert interim git workflow to two-tier

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `docs/pause-staging-tier` |
| **Depends on** | `039-introduce-staging-environment-tier.md` (this amends the docs that handoff introduced) |

---

## Problem

Root `CLAUDE.md` and `docs/ARCHITECTURE.md` currently describe a working three-tier branch/environment model (`main` ← `staging` ← `development` ← `feature/*`) as though `staging` is live and operational. It isn't yet — see handoff 039's status update. Env var wiring between Vercel and the staging Supabase project hit repeated issues (IPv6/pooler connection string, an auth-vs-database project mismatch, and an unresolved Postgres password-auth failure) and Alex chose to pause rather than keep debugging live.

Leaving the docs as-is risks a real mistake: Claude Code (or anyone) reading `CLAUDE.md` would reasonably believe `staging` is a working checkpoint and could, for example, tell a bot-authored PR to retarget there, or assume a merge to `staging` provides real verification before `main` — neither is true right now.

---

## Background

This is a temporary reversion, not a design change. The three-tier model is still the intended end state — the underlying decision (separate Supabase project for staging, cost-effectiveness over Supabase Branching) hasn't changed, only its current operational status. Keep the full staging design documented, just clearly flagged as paused, so resuming later is a matter of removing a callout, not rewriting the docs from scratch.

---

## Affected files

- Root `CLAUDE.md` — "Data & environments" and "Git workflow" sections
- `docs/ARCHITECTURE.md` §15.4 (Git workflow) and §17 (Environment Configuration, "Staging environment configuration" subsection)

---

## Implementation steps

1. **Add a paused-status callout to root `CLAUDE.md`'s staging bullet**

   Immediately above the existing `**\`staging\` branch → closed testing...**` bullet in "Data & environments," add:

   ```markdown
   > ⚠ **Staging is not operational yet (as of 2026-07-04).** The project is provisioned and schema is applied, but Vercel↔Supabase environment variable wiring isn't working end-to-end — see handoff 039's status update for the diagnostic history. Until this callout is removed, treat `main` as receiving merges directly from `development` (temporary reversion — see the Git workflow section below), not from `staging`.
   ```

   Commit: `docs: flag staging tier as not yet operational`

2. **Revert the interim merge-flow language in `CLAUDE.md`'s Git workflow section**

   Replace:

   ```markdown
   - `development` merges up into `staging` for a real-backend check before anything reaches production. `staging` merges up into `main` only after that check passes. Automated or bot-authored PRs (e.g. Vercel Agent integrations) that default to targeting `main` should be retargeted to `staging` before merging — do not merge them to `main` directly.
   ```

   With:

   ```markdown
   - **Interim, while staging is paused (see callout above):** `development` merges directly into `main`, same as before the staging tier was introduced. Automated or bot-authored PRs (e.g. Vercel Agent integrations) that default to targeting `main` should be retargeted to `development` first, so at least one review step happens before `main` — not to `staging`, which isn't functional yet.
   - **Once staging is operational again:** `development` merges up into `staging` for a real-backend check before anything reaches production; `staging` merges up into `main` only after that check passes. Bot-authored PRs should retarget to `staging` at that point, not `development`.
   ```

   Commit: `docs: revert interim git workflow to two-tier merge flow while staging is paused`

3. **Mirror both changes into `docs/ARCHITECTURE.md`**

   Same callout above the git workflow's branch model line in §15.4, and the same interim-vs-future merge-flow split replacing the current single bullet there. Also add a one-line note to the "Staging environment configuration" subsection under §17: "Not currently operational — see `CLAUDE.md` and handoff 039."

   Commit: `docs: mirror staging-paused status into ARCHITECTURE.md`

---

## Verification

- [ ] Both `CLAUDE.md` and `ARCHITECTURE.md` clearly state staging is paused, with a pointer to handoff 039 for why.
- [ ] Both documents' git workflow sections describe the interim two-tier flow as current, with the three-tier flow described as the target to resume later — not as already active.
- [ ] Grep both files for "not yet operational" — confirm present in both.
- [ ] No code changes in this handoff — docs only.

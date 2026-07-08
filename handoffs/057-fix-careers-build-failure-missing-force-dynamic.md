# Fix production build failure: careers pages missing `force-dynamic`

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `critical` |
| **Type** | `fix` |
| **Branch** | `fix/careers-build-dynamic` |
| **Depends on** | none |

---

## Problem

`pnpm turbo build --filter=@grassroots/web` is failing on `main` (exit 1) after handoff 055 merged. The error Alex pasted was just `ERROR run failed: command exited (1)` with no build log body, so **this diagnosis is from code inspection and a matching precedent already in this codebase, not from reading the actual compiler/runtime error** — pull the full Vercel build log first to confirm before assuming this is the only issue (see Verification).

**Most likely cause:** `apps/web/src/app/(auth)/careers/page.tsx` and `apps/web/src/app/(auth)/careers/[slug]/page.tsx` (both new in handoff 055) call `getDataClient().getPublishedJobPostings()` / `getJobPostingBySlug()` — real Drizzle/Postgres calls — inside an async Server Component with **no `export const dynamic = 'force-dynamic'`**. Neither page calls `cookies()`/`headers()` or any other Next.js dynamic API, so by default Next.js will try to **statically prerender both at build time**, executing a live database query during `next build` itself.

This exact failure mode already happened once in this codebase and already has an established fix: `apps/web/src/app/(auth)/page.tsx` (the landing page) calls `getWaitlistCount()` the same way and carries `export const dynamic = 'force-dynamic'` specifically because of this (see handoff 047's note: "the route is explicitly `force-dynamic`"). The two new careers pages do the same kind of build-time-reachable DB call but never got the same treatment.

By contrast, `/admin/*` pages are **not** at risk of this — `admin/layout.tsx` calls `createServerClient()`, which calls `cookies()` internally (`apps/web/src/lib/supabase/server.ts`), and using a dynamic API anywhere in a route's layout tree already forces the whole subtree to render dynamically. No change needed there.

---

## Affected files

- `apps/web/src/app/(auth)/careers/page.tsx`
- `apps/web/src/app/(auth)/careers/[slug]/page.tsx`

---

## Implementation steps

1. **Add `export const dynamic = 'force-dynamic'` to both files**, same placement as the landing page (top of file, alongside/near the `metadata` export):

   ```ts
   export const dynamic = 'force-dynamic'
   ```

   Commit: `fix(careers): mark listing and detail pages as force-dynamic to fix build`

2. **Run `pnpm turbo build --filter=@grassroots/web` locally before pushing** and confirm it actually succeeds — don't push on the strength of this diagnosis alone, since it wasn't confirmed against the real error text (see Problem).

3. **If the build still fails after step 1**, pull the full Vercel build log (not just the truncated tail Alex has) and report back the actual error rather than continuing to guess — there could be a second, unrelated issue (e.g. a type error) bundled into the same failing deploy.

---

## Verification

- [ ] `pnpm turbo build --filter=@grassroots/web` succeeds locally.
- [ ] `/careers` and `/careers/[slug]` still render correctly at runtime (dynamic rendering doesn't change behavior, just defers execution from build-time to request-time).
- [ ] Push and confirm the Vercel deployment for this branch builds successfully before merging.
- [ ] If step 1 wasn't sufficient, the real root cause from the full build log is identified and reported before attempting another fix.

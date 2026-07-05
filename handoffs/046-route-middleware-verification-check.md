# Add a route/middleware classification check (pre-commit)

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `chore` |
| **Branch** | `chore/route-middleware-check` |
| **Depends on** | `045` (land that fix first — this handoff adds a check that would otherwise immediately fail on the current `/privacy`/`/terms`/`/careers` gap) |

---

## Problem

Twice now, a new page route has shipped without a corresponding decision in `apps/web/src/middleware.ts`'s `PUBLIC_PATHS` allow-list: `/privacy` and `/terms` (handoffs 027/028) and `/careers` (handoff 044) were all built as intentionally public pages, but nobody updated `PUBLIC_PATHS` alongside them, so logged-out/non-active visitors got silently redirected away instead of being able to read them (fixed in handoff 045). This is a "forgot a step" class of bug, not a one-off — nothing today forces whoever adds a route to also make an explicit access-level decision for it.

---

## Background

Because `middleware.ts` fails closed (anything not in `PUBLIC_PATHS` requires an active session), a forgotten public route breaks silently — no error, no crash, just a wrong redirect a real user eventually hits. The safest fix isn't to change the fail-closed default (that's correct); it's to make the *decision itself* unavoidable and checked before a route change can be committed.

---

## Affected files

- `apps/web/src/middleware.ts` — add a `GATED_PATHS` array alongside the existing `PUBLIC_PATHS`
- `scripts/check-route-access.mjs` — new, the verification script
- `package.json` (repo root) — add `check:routes` script, `prepare` script, `husky`/`lint-staged` devDependencies, `lint-staged` config
- `.husky/pre-commit` — new
- `CLAUDE.md` (repo root) — add the process rule
- `handoffs/CLAUDE.md` — add a checklist reminder for future handoffs that add routes

---

## Token dependencies

None — this is tooling/process only, no UI.

---

## Implementation steps

1. **Add `GATED_PATHS` to `apps/web/src/middleware.ts`**

   This array is **not read by the `middleware()` function itself** — the existing fail-closed default already gates anything outside `PUBLIC_PATHS`, and that logic should not change. `GATED_PATHS` exists purely so every route has an explicit, reviewable classification for the check in step 2 to verify against, instead of relying on an implicit default. Add it directly below `PUBLIC_PATHS`:

   ```ts
   const PUBLIC_PATHS = ['/', '/signup', '/login', '/check-email', '/auth/callback', '/privacy', '/terms', '/careers'];

   // Not read by middleware() — the fail-closed default already gates anything
   // outside PUBLIC_PATHS. This exists so every route has an explicit, reviewable
   // access-level decision on record, checked by scripts/check-route-access.mjs
   // (see package.json's check:routes / the pre-commit hook). Add every new
   // intentionally-gated route here.
   const GATED_PATHS = ['/feed', '/feed/:param', '/profile/:param', '/waitlisted'];
   ```

   (`:param` is the normalized form the checker script uses for dynamic segments — see step 2. It's a documentation-only placeholder, not real route syntax.)

   Commit: `chore(middleware): add GATED_PATHS for explicit route classification`

2. **Write `scripts/check-route-access.mjs`**

   ```js
   #!/usr/bin/env node
   // Verifies every route under apps/web/src/app is explicitly classified in
   // apps/web/src/middleware.ts as PUBLIC_PATHS or GATED_PATHS. Fails (exit 1)
   // if a route exists that isn't accounted for in either list. Run via
   // `pnpm check:routes`; wired as a pre-commit hook (.husky/pre-commit) so a
   // new route can't be committed without an access-level decision.
   //
   // Known, expected exceptions (not bugs if flagged as "stale" below):
   //   - /auth/callback is a route.ts Route Handler, not a page.tsx, so it's
   //     never "discovered" by this script but is legitimately in PUBLIC_PATHS.
   //   - /waitlisted is in GATED_PATHS for documentation, even though
   //     middleware() also has its own separate startsWith('/waitlisted') check.

   import { readFileSync, readdirSync, statSync } from 'node:fs';
   import { join, relative, sep } from 'node:path';

   const APP_DIR = join(process.cwd(), 'apps/web/src/app');
   const MIDDLEWARE_PATH = join(process.cwd(), 'apps/web/src/middleware.ts');
   const EXPECTED_EXTRAS = new Set(['/auth/callback', '/waitlisted']);

   function findPageFiles(dir) {
     const results = [];
     for (const entry of readdirSync(dir)) {
       const full = join(dir, entry);
       const stat = statSync(full);
       if (stat.isDirectory()) {
         results.push(...findPageFiles(full));
       } else if (entry === 'page.tsx') {
         results.push(full);
       }
     }
     return results;
   }

   function toRoutePath(pageFile) {
     const rel = relative(APP_DIR, pageFile).split(sep);
     rel.pop(); // drop 'page.tsx'
     const segments = rel
       .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')'))) // strip route groups
       .map((seg) => (seg.startsWith('[') && seg.endsWith(']') ? ':param' : seg));
     const path = '/' + segments.join('/');
     return path.length > 1 ? path.replace(/\/$/, '') : path;
   }

   function normalize(path) {
     return path.replace(/\[[^\]]+\]/g, ':param').replace(/\/$/, '') || '/';
   }

   function extractArray(source, name) {
     const re = new RegExp(`const ${name}\\s*=\\s*\\[([^\\]]*)\\]`, 's');
     const match = source.match(re);
     if (!match) {
       throw new Error(`Could not find "${name}" array in middleware.ts — has it been renamed?`);
     }
     return match[1]
       .split(',')
       .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
       .filter(Boolean);
   }

   const discoveredRoutes = new Set(findPageFiles(APP_DIR).map(toRoutePath).map(normalize));

   const middlewareSource = readFileSync(MIDDLEWARE_PATH, 'utf-8');
   const publicPaths = extractArray(middlewareSource, 'PUBLIC_PATHS').map(normalize);
   const gatedPaths = extractArray(middlewareSource, 'GATED_PATHS').map(normalize);
   const known = new Set([...publicPaths, ...gatedPaths]);

   const unclassified = [...discoveredRoutes].filter((r) => !known.has(r));
   const stale = [...known].filter((r) => !discoveredRoutes.has(r) && !EXPECTED_EXTRAS.has(r));

   let hasError = false;

   if (unclassified.length > 0) {
     hasError = true;
     console.error('\n✖ Found route(s) not classified in middleware.ts:\n');
     unclassified.forEach((r) => console.error(`  ${r}`));
     console.error(
       '\nAdd each to PUBLIC_PATHS (readable by logged-out/non-active visitors) or\n' +
       'GATED_PATHS (requires an active session) in apps/web/src/middleware.ts,\n' +
       'then re-run `pnpm check:routes`.\n'
     );
   }

   if (stale.length > 0) {
     console.warn('\n⚠ middleware.ts lists path(s) with no matching route (not blocking):\n');
     stale.forEach((r) => console.warn(`  ${r}`));
     console.warn('\nRemove these from PUBLIC_PATHS/GATED_PATHS if the route was deleted.\n');
   }

   if (hasError) {
     process.exit(1);
   }

   console.log(`✓ All ${discoveredRoutes.size} route(s) are explicitly classified in middleware.ts.`);
   ```

   Commit: `chore: add check-route-access script`

3. **Wire it into `package.json` and add husky + lint-staged**

   Add to root `package.json`:

   ```json
   "scripts": {
     "build": "turbo build",
     "dev": "turbo dev",
     "lint": "turbo lint",
     "type-check": "turbo type-check",
     "format": "prettier --write \"**/*.{ts,tsx,md}\"",
     "check:routes": "node scripts/check-route-access.mjs",
     "prepare": "husky"
   },
   ```

   Add `husky` and `lint-staged` to `devDependencies` (latest majors — `husky` v9, `lint-staged` v15 as of this writing; use whatever `pnpm add -D husky lint-staged` resolves).

   Add a `lint-staged` config block:

   ```json
   "lint-staged": {
     "apps/web/src/app/**/page.tsx": "node scripts/check-route-access.mjs",
     "apps/web/src/middleware.ts": "node scripts/check-route-access.mjs"
   }
   ```

   Run `pnpm install` after this so the `prepare` script initializes `.husky/`.

   Commit: `chore: add husky + lint-staged for route access verification`

4. **Add `.husky/pre-commit`**

   ```sh
   npx lint-staged
   ```

   (Husky v9 pre-commit files are plain shell scripts — no `husky.sh` sourcing boilerplate needed. Make it executable.)

   Commit: `chore: wire pre-commit hook for route access check`

5. **Add the process rule to root `CLAUDE.md`**

   In the "Git workflow" section, add a new bullet after the existing "Before starting any task, verify the working branch is up to date" rule:

   ```markdown
   - **Any new page route (`page.tsx` under `apps/web/src/app`) must be explicitly classified in `apps/web/src/middleware.ts` before committing** — added to `PUBLIC_PATHS` if it should be readable by logged-out or non-active visitors, or to `GATED_PATHS` if it requires an active session. This is enforced by a pre-commit hook (`pnpm check:routes` via husky/lint-staged) that fails the commit if a route isn't accounted for in either list. Do not bypass the hook (`--no-verify`) to skip this — if the check is wrong, fix `scripts/check-route-access.mjs`, don't skip it.
   ```

   Commit: `docs: add route/middleware classification rule to CLAUDE.md`

6. **Add a checklist reminder to `handoffs/CLAUDE.md`**

   In the "For Claude Code" numbered list, add a new item after the existing "Implement exactly what is described" step:

   ```markdown
   4a. **If this handoff adds a new route**, classify it in `apps/web/src/middleware.ts`'s `PUBLIC_PATHS` or `GATED_PATHS` as part of this handoff's implementation, even if `middleware.ts` isn't listed in **Affected files** — route classification is a standing requirement (see root `CLAUDE.md`), not optional scope. Run `pnpm check:routes` before your final commit.
   ```

   Commit: `docs: note route classification requirement in handoffs process`

---

## Verification

- [ ] `pnpm check:routes` passes cleanly against the current `development` branch (after handoff 045 lands) — all real routes accounted for, no unclassified, no stale entries beyond the two documented exceptions.
- [ ] Temporarily add a throwaway `apps/web/src/app/(auth)/test-unclassified/page.tsx`, confirm `pnpm check:routes` fails with that path listed, then delete the throwaway file.
- [ ] Stage a change under `apps/web/src/app/**/page.tsx` and attempt a commit with the throwaway route still present — confirm the pre-commit hook blocks it. Remove the throwaway file and confirm the hook allows the commit through.
- [ ] `pnpm install` completes without errors and `.husky/pre-commit` exists and is executable.
- [ ] `pnpm type-check` passes.

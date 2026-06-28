# Doc alignment — single-repo / no-Tailwind cleanup

> Sweep of the standing docs for stale "vendor from `grassroots-design-system-core`" and
> "Tailwind 4" language, now that (a) `packages/design-system/` is the **single source of
> truth** maintained in-repo, and (b) Tailwind was removed in favor of native CSS + CSS Modules.
> Apply on the same `fix/` branch as Amendment 04. Commit as `docs:`.
>
> **The corrected files are already written in this folder at their real repo paths** — diff
> and commit them wholesale rather than hand-applying find/replace:
> `design-handoffs/README.md`, `design-handoffs/CLAUDE.md`,
> `design-handoffs/core-social-mvp/README.md`, `design-handoffs/core-social-mvp/ARCHITECTURE.md`,
> and the superseded banner on `AMENDMENT-03-…md`. The **only** change outside `design-handoffs/`
> is item 1 below (sync the repo-root `/CLAUDE.md`). This doc is the rationale + per-file diff.

## ✅ Already correct — no change

- **`/CLAUDE.md`** (repo root) — already points to `packages/design-system/CLAUDE.md`, says "derive
  everything from `packages/design-system/`", and has a "native CSS, no utility framework —
  `tailwindcss` removed" section. This is the model the others should match.

## 1. `design-handoffs/CLAUDE.md` — stale staging copy (highest priority)

This is the staging copy meant to be committed as `/CLAUDE.md`, but it's the **old** version and now
**contradicts the live root `/CLAUDE.md`** (it still says design-system-core, "Vendor the tokens into
`apps/web/src/styles/tokens.css` and map the Tailwind 4 config", "Recreate the components as React").

- **Fix:** replace its entire contents with the current `/CLAUDE.md`, so the staging copy and the live
  file are identical. (Simplest: `cp CLAUDE.md design-handoffs/CLAUDE.md`.)

## 2. `design-handoffs/README.md` — step 1 + folder note

- Step 1 of "How a handoff is consumed":
  - **Was:** "Reads the design-system repo (`grassrootsonline/grassroots-design-system-core`) and treats
    its `CLAUDE.md` as binding for visual style."
  - **Now:** "Reads `packages/design-system/CLAUDE.md` (the binding style guide, in-repo) for visual style."
- Folder-layout block now names the staging file `CLAUDE.md` (matching the actual file; the old text said `grassroots-platform.CLAUDE.md`).

## 3. `design-handoffs/core-social-mvp/README.md` — "Engineering setup" (biggest rewrite)

The whole "You are working across **two repositories**" framing + "Step 1 — Pull in the design system"
is obsolete: there's one repo, the integration is settled, and Tailwind is gone.

- **Was:** two-repo list (`grassroots-design-system-core` = source of truth + `grassroots-platform`).
  **Now:** one repo; the design system lives at `packages/design-system/` and is the source of truth.
- **Delete** the "Preferred — vendor the tokens … wire the Tailwind 4 config" / "Alternative — git
  submodule + `@import` index.css" choice block entirely.
  **Replace** with: *"The design system already lives at `packages/design-system/` and is imported by
  `apps/web/src/styles/globals.css`. Consume it directly — CSS Modules + design-system token `var(--…)`
  + the global component classes (`.btn`, `.feed-card`, …). No Tailwind, no vendoring, no eyeballing
  values from the prototype HTML."*
- **Was:** "`CLAUDE.md` in the design-system repo is binding".
  **Now:** "`packages/design-system/CLAUDE.md` is binding".

## 4. `design-handoffs/core-social-mvp/ARCHITECTURE.md` — Tailwind references

Four spots now contradict the removed-Tailwind reality:

- **Tech-stack table (~line 81):** `Styling | Tailwind CSS 4 + CSS custom properties` →
  `Styling | Native CSS + CSS Modules, design-system tokens via CSS custom properties (no utility framework)`.
- **Monorepo tree (~line 134):** `config/   # Shared ESLint, Prettier, Tailwind configs` → drop "Tailwind".
- **§12.3 Design token rules (~line 678):** point tokens at `packages/design-system/tokens/` (not
  `styles/tokens.css`). The "no hard-coded hex" rule stays.
- **§15.2 (~line 752):** "No inline styles. Tailwind classes mapped to design tokens only." →
  "No Tailwind. Component-scoped styles via CSS Modules referencing design-system tokens; global
  design-system classes for shared components; inline `style` only for dynamic values."

> Note: §12.3 / §15.2 were the exact instructions that caused the original drift (they assumed a
> Tailwind→token bridge that never existed). Updating them is what stops a future session from
> reintroducing the pattern.

## 5. Historical amendments — add a banner, don't rewrite

- **`AMENDMENT-03-design-token-tailwind-bridge.md`** proposed the Tailwind 4 `@theme` bridge. The team
  instead **removed Tailwind** (CSS-first). Add a one-line banner at the top so no one implements the
  obsolete approach: *"⚠ Superseded: the platform went CSS-first (Tailwind removed). The diagnosis
  here still holds; the `@theme` fix does not — see `/CLAUDE.md` and Amendment 04."*
- `AMENDMENT-01` / `AMENDMENT-02` mention design-system-core only as point-in-time history — leave as-is.

## 6. `packages/design-system/CLAUDE.md` — verify only

It's the binding guide, now correctly co-located. Confirm it doesn't instruct readers to fetch/`@import`
from a separate `grassroots-design-system-core` repo; if it does, change those to in-repo paths. Low priority.

## Checklist

- [ ] 1. **The repo-root `/CLAUDE.md` is already current** — confirm it matches
      `design-handoffs/CLAUDE.md` (this folder's staging copy, now corrected). No edit
      expected; if they differ, copy the staging file to `/CLAUDE.md`.
- [x] 2. `design-handoffs/README.md` step 1 → `packages/design-system/CLAUDE.md`. *(done in this folder)*
- [x] 3. `core-social-mvp/README.md` "Engineering setup" rewritten for single-repo / no-Tailwind. *(done)*
- [x] 4. `ARCHITECTURE.md` four Tailwind/tokens spots updated. *(done)*
- [x] 5. "Superseded" banner added to Amendment 03. *(done)*
- [ ] 6. Skim `packages/design-system/CLAUDE.md` for external-repo references (verify only). *(in-repo — not in this handoff folder)*
- [ ] — commit the folder: `docs: single-repo + native-CSS doc alignment`

## Motion reconciliation — design system wins (resolved)

`ARCHITECTURE.md` §12.2 and the `core-social-mvp/README.md` Motion paragraph previously specified motion
that violated the binding design-system rule. Per "the design system always wins," both are now corrected:

- **Like / react** — was spring `scale 1.25→1`; now the heart turns sage (120ms color), count increments,
  **no scale/spring, never fills**. (Already implemented in `fixtures/v04/feed-card.tsx`.)
- **Button press** — was `whileTap: { scale: 0.97 }`; now an opacity drop (~0.76), **no scale**.
- **Notification bell** — was a bounce; now the unread dot fades in, **no bounce**.
- A binding note was added at the top of §12.2 stating the DS motion rule governs (motion tokens; opacity/color, not transforms).

**Code follow-up (Claude Code):** grep the app for `whileTap={{ scale` / `scale: 1.25` / bell bounce
keyframes and replace with the opacity/color equivalents above — the docs now describe the target.

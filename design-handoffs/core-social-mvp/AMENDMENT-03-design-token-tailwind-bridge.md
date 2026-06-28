# Amendment 03 — Design-token ↔ Tailwind 4 bridge (theme registration)

> **⚠ SUPERSEDED.** The team did not take the Tailwind `@theme` approach below — the
> platform was migrated **CSS-first (Tailwind removed entirely)**, with the design system
> living in-repo at `packages/design-system/`. The *diagnosis* in this amendment still holds
> (three competing styling systems, hardcoded hex, stale DS layers); the *fix* (a Tailwind 4
> `@theme` bridge) does **not** apply. For the current model see `/CLAUDE.md` ("native CSS, no
> utility framework") and **Amendment 04** for the remaining color-token cleanup. Kept for history.

**Feature:** core-social-mvp
**Screen(s) affected:** Global — styling foundation (`apps/web/src/styles/*`) and every component that references a token. No visual redesign; this makes the *intended* design system actually reachable through Tailwind and removes drift.
**Date:** 2026-06-28
**Updated source:** none (foundation/build change, no prototype delta). The prototypes already render correctly; this aligns the **platform codebase** to them.
**Source of changes:** maintainer diagnosis — "the design system isn't applied consistently; possibly the framework doesn't support it natively." Both were correct and share one root cause (below).

---

## ⚠ Branch & merge rule (read first)

Implement on a branch — **do not commit to `main`, do not merge, do not open a PR.**

```bash
git checkout development && git pull
git checkout -b fix/core-social-mvp-token-tailwind-bridge
# ... apply the steps below, committing in logical chunks ...
git push -u origin fix/core-social-mvp-token-tailwind-bridge
# stop. Maintainer reviews the Vercel preview and merges manually.
```

Branch model unchanged: **`main` ← `development` ← `feature/*` | `fix/*`**. Use `fix/` (Conventional Commits `fix:`/`refactor:`), per `ARCHITECTURE.md` §15.4.

---

## Root cause (the diagnosis)

The platform uses **Tailwind CSS 4**. In v4 the theme is configured **in CSS via the `@theme {}` directive** — there is no JS `tailwind.config` mapping. The design tokens, however, were vendored into `apps/web/src/styles/tokens.css` as a plain `:root { --color-accent: … }` block and merely `@import`ed. **There is no `@theme` block anywhere in `apps/web`, and zero semantic utilities** (`bg-accent`, `text-ink`, `border-border`) are used anywhere — because Tailwind was never told the tokens exist, so those classes were never generated.

So the standing instruction — `CLAUDE.md` ("map the Tailwind 4 config to those CSS variables") and `ARCHITECTURE.md` §12.3 / §15.2 ("Tailwind classes mapped to design tokens only") — **was not implementable as written**: the v4 `@theme` bridge that makes `bg-accent` resolve to the token was never created. With no semantic utilities available, implementation fell back to whatever rendered, producing **three competing styling systems**:

1. **Vendored semantic CSS classes** (`.btn`, `.feed-card`, `.action-btn`, `.navbar`) in `components.css` — the faithful, dominant path.
2. **Arbitrary-value escape hatches** wherever a token was needed through Tailwind — `text-[var(--color-accent)]`, `bg-[var(--color-surface)]`, `rounded-[var(--radius-md)]`, `text-[16px]`, `font-[500]`, `duration-[120ms]`, `border-[0.5px]`. The verbose `[…]` syntax IS the "framework doesn't support it natively" symptom.
3. **Inline styles + hardcoded hex.**

### Concrete drift this caused

- **Components implemented twice, and they disagree.** `Badge` and `Card` exist both as `.tsx` (arbitrary Tailwind values) **and** as `.badge-*` / `.card` classes in `components.css`, with different results: badge "muted" is `bg-[var(--color-border)]` in the TSX but `background: var(--color-surface)` in the CSS; badge tracking is `0.04em` non-uppercase in the TSX but `--tracking-label` (`0.08em`) uppercase in the CSS. Whichever path a screen happens to use changes the look.
- **Hardcoded hex breaks dark mode.** `components.css` hardcodes `#2E5C2C` (×3 — `.badge-accent`, `.avatar`, `.toast-success`), plus `#EAE7E1`, `#5A5950`, `#F0EAE0`, `#7A5C30`, `#fff`. A token for the first one even exists (`--color-accent-ink`) and is used in the TSX twin — but the CSS twin ignores it, so those greens **stay dark-green on the dark canvas** in dark mode instead of flipping.
- **Motion values hardcoded.** `duration-[120ms]` and hand-tuned springs in `feed-card.tsx` instead of the design system's `motion.css` tokens.
- **Platform is stale vs. the design system.** Amendment 02 made `motion.css`, `responsive.css`, and `components-new.css` binding, but **none are vendored** into the platform — no motion tokens, no responsive/bottom-sheet/mobile-tab system, no Tabs/Dropdown/Tooltip/Command-palette patterns.

---

## What changed (the fix)

All deltas use existing Grassroots tokens — **no new tokens, colors, type, or spacing introduced.** The change is structural: register the tokens with Tailwind, then collapse to one system.

1. **Add the `@theme` bridge (the unlock).** Replace `apps/web/src/styles/globals.css` with the corrected version in this amendment's `fixtures/globals.css`. It moves every token into a Tailwind 4 `@theme {}` block so the semantic utilities are generated: `bg-canvas` `bg-surface` `text-ink` `text-secondary` `border-border` `border-border-strong` `text-accent` `bg-accent-subtle` `rounded-lg` `rounded-pill` `text-body` `text-label` `font-medium` `tracking-label` `gap-md` `px-lg` `duration-fast` `ease-spring`, etc. `tokens.css` is folded into `@theme`, so the standalone `tokens.css` import is removed (keep the file or delete it — it's no longer imported).
   - Dark-mode overrides stay in a normal `@media (prefers-color-scheme: dark) { :root { … } }` block **outside** `@theme` (it overrides the same var names; utilities flip automatically). **Do not use `@theme inline`** — it bakes values into utilities and breaks the dark-mode override.
   - Guardrail included: `--color-*: initial; --font-*: initial;` inside `@theme` drops Tailwind's stock palette so `bg-blue-500` / `text-red-600` can't be reached — enforcing "**sage is the only accent, never blue**" at the framework level. The numeric spacing scale is kept (so existing `gap-3` / `px-3` keep working) while named keys (`gap-md`) are added.

2. **Standardize on ONE system; delete the duplicates.** App/page code uses the `@theme` token utilities. `components.css` is trimmed to only the genuinely component-level classes that compose multiple rules and states (`.btn*`, `.feed-card*`, `.navbar*`, `.notif*`, `.empty-state*`, `.toast*`, `.field*`, `.input`, `.avatar*`, `.action-btn`). Remove the `.badge`/`.badge-*` and `.card` blocks — `Badge` and `Card` become the single TSX implementations in this amendment's `fixtures/badge.tsx` and `fixtures/card.tsx`.

3. **Replace hardcoded hex in `components.css` with tokens.**
   - `.badge-accent` `color: #2E5C2C` → `var(--color-accent-ink)`
   - `.avatar` `color: #2E5C2C` → `var(--color-accent-ink)`
   - `.toast-success` `background: #2E5C2C` → `var(--color-accent-ink)`
   - `.btn-danger` `color: #fff` → `var(--color-white)` (or `var(--color-canvas)` for the warm off-white used elsewhere on filled buttons — match `.btn-primary`)
   - `.badge-default` `#EAE7E1` / `#5A5950`, `.badge-warm` `#F0EAE0` / `#7A5C30` → the corresponding tokens (`--color-warm`, `--color-warm-subtle`, `--color-secondary`, `--color-border`). After this there are **no raw hex values in component code** (§12.3 / §15.2 satisfied) and dark mode flips correctly.

4. **Migrate arbitrary values → semantic utilities** in the components that used them. Mechanical find/replace:
   - `text-[var(--color-accent)]` → `text-accent` · `bg-[var(--color-surface)]` → `bg-surface` · `bg-[var(--color-canvas)]` → `bg-canvas` · `text-[var(--color-ink)]` → `text-ink` · `text-[var(--color-secondary)]` → `text-secondary` · `bg-[var(--color-accent-subtle)]` → `bg-accent-subtle`
   - `rounded-[var(--radius-md)]` → `rounded-md` · `rounded-[var(--radius-lg)]` → `rounded-lg`
   - `text-[11px]` → `text-label` · `text-[12px]/[13px]` → `text-small` · `text-[14px]` → `text-body` · `text-[16px]/[18px]` icon sizes → keep as pixel arbitrary on the `<i>` (icon glyph sizing is fine per the guide: 14/16/18/20px) **or** `text-base`/`text-lg`; `font-[500]` → `font-medium`; `tracking-[0.08em]` → `tracking-label`; `duration-[120ms]` → `duration-fast`.
   - Files touched: `components/feed/feed-card.tsx`, `components/layout/left-rail.tsx`, `components/layout/navbar.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`. (The `z-[var(--z-overlay)]` in navbar can stay — z-index isn't a theme namespace; or add `--z-*` keys if you prefer utilities.)

5. **Vendor the three new design-system stylesheets (Amendment 02 follow-through).** Port `motion.css`, `responsive.css`, and `components-new.css` from `grassroots-design-system-core` into `apps/web/src/styles/design-system/` and import them from `globals.css` (after `@theme`). The motion durations/easing are already in `@theme` (`duration-*`, `ease-*`) — wire the §12.2 Framer Motion specs to them (modal = `gr-scale-in` at `--duration-slow`/`--ease-spring`; 120ms hovers = `--duration-fast`/`--ease-standard`) and stop hardcoding spring values in `feed-card.tsx`. Adopt `responsive.css` breakpoints (sidebar drops at **1024px**, navbar → bottom tab bar at **767px**, cards full-bleed + modals → bottom sheets under 768px) — this supersedes the interim 1127/1128px values from Amendment 02.

## Fixtures included (ready to drop in)

All under `design-handoffs/core-social-mvp/fixtures/`:

| Fixture | Replaces | Notes |
|---|---|---|
| `globals.css` | `apps/web/src/styles/globals.css` | The `@theme` bridge — the unlock. |
| `components.css` | `apps/web/src/styles/design-system/components.css` | Hex→tokens; `.badge*`/`.card` removed; transitions on motion tokens. |
| `badge.tsx` | `apps/web/src/components/ui/badge.tsx` | Single source; token utilities; correct `tracking-label` + uppercase. |
| `card.tsx` | `apps/web/src/components/ui/card.tsx` | Single source; token utilities. |
| `feed-card.tsx` | `apps/web/src/components/feed/feed-card.tsx` | Arbitrary values → utilities; keeps `.feed-card`/`.action-btn` classes. |
| `left-rail.tsx` | `apps/web/src/components/layout/left-rail.tsx` | Arbitrary values → utilities; nav hover corrected to `bg-surface`. |
| `motion.css` | new — `…/styles/design-system/motion.css` | Vendored verbatim from the design system. |
| `responsive.css` | new — `…/styles/design-system/responsive.css` | Vendored verbatim (1024/767 breakpoints). |
| `components-new.css` | new — `…/styles/design-system/components-new.css` | Vendored; one hex token-backed (`.tab-badge`). |

`navbar.tsx`, `avatar.tsx`, `input.tsx`, `button.tsx` need **no token migration** — they already compose `components.css` classes. (`navbar` keeps `z-[var(--z-overlay)]`; z-index is not a theme namespace. `button`/`feed-card` keep `text-[16px]` on Tabler `<i>` glyphs — icon sizing is an allowed per-glyph value, not a token.)

## Migration map — apply to the page-level files

The `(public)/page.tsx` and `(platform)/feed/page.tsx` (and check `components/feed/composer-modal.tsx`, `components/auth/auth-modal.tsx`, `components/notifications/notification-panel.tsx`, `components/ui/toast.tsx`) carry the **same** arbitrary-value drift — dozens of `bg-[var(--…)]`, `text-[NNpx]`, `font-[500]`, `duration-[120ms]`. No fixture is shipped for these (they're page-specific); apply this mechanical find/replace once `@theme` exists:

```
text-[var(--color-ink)]          → text-ink
text-[var(--color-ink-soft)]     → text-ink-soft
text-[var(--color-secondary)]    → text-secondary
text-[var(--color-muted)]        → text-muted
text-[var(--color-accent)]       → text-accent
text-[var(--color-accent-ink)]   → text-accent-ink
text-[var(--color-canvas)]       → text-canvas
bg-[var(--color-surface)]        → bg-surface
bg-[var(--color-canvas)]         → bg-canvas
bg-[var(--color-ink)]            → bg-ink
bg-[var(--color-accent-subtle)]  → bg-accent-subtle
border-[var(--color-border)]         → border-border
border-[var(--color-border-strong)]  → border-border-strong
border border-[0.5px]            → border-[0.5px]   (single hairline; the bare `border` is redundant)
rounded-[var(--radius-md)]       → rounded-md
rounded-[var(--radius-lg)]       → rounded-lg
rounded-[var(--radius-pill)]     → rounded-pill
font-[500]                       → font-medium
tracking-[0.08em]                → tracking-label
duration-[120ms]                 → duration-fast
leading-[var(--leading-body)]    → leading-body   (add --leading-* to @theme if you want these as utilities; otherwise keep)
hover:opacity-[0.88]             → hover:opacity-88   (or keep arbitrary — opacity isn't a token)
```

Leave genuinely non-token arbitrary values alone: pixel font-sizes on Tabler `<i>` glyphs, one-off `text-[52px]`/`text-[17px]` display sizes on the marketing page (or promote them to the type scale if you prefer), layout values (`w-[188px]`, `h-[calc(...)]`, `top-[80px]`), and `style={{ fontFamily: 'var(--font-display)' }}` (or swap to `font-display`). The `inline style` blocks on the landing CTA can move to utilities too but aren't token-drift.

## What did NOT change

- No visual redesign. Copy, the warm-neutral + single-sage palette, the type scale (Inter 400/500 + DM Serif Display for wordmark/headings), 0.5px borders, shadowless cards, and Tabler-outline iconography are unchanged — this makes them *consistently reachable*, not different.
- Feed / profile / thread / composer / auth / notifications **behavior** is unchanged.
- The seeded-vs-live data layer rule and the dev banner are untouched.
- Token *values* are identical to `tokens.css`; they only move into `@theme`.

## Execution checklist (in order, commit per chunk)

- [ ] **1.** Replace `apps/web/src/styles/globals.css` with `fixtures/globals.css`. Delete `apps/web/src/styles/tokens.css` (superseded by `@theme`; its old `@import` is gone). — `refactor: register design tokens in tailwind @theme`
- [ ] **2.** `pnpm --filter @grassroots/web dev` and confirm a sample utility resolves: an element with `class="bg-accent"` paints sage (DevTools → the rule is `background-color: var(--color-accent)`), not "unknown class / no style". This proves the bridge before migrating anything.
- [ ] **3.** Drop in `fixtures/components.css` (hex→tokens, `.badge*`/`.card` removed, transitions on motion tokens) and `fixtures/badge.tsx` + `fixtures/card.tsx`. — `refactor: single-source Badge/Card; token-back component hex`
- [ ] **4.** Drop in `fixtures/feed-card.tsx` + `fixtures/left-rail.tsx`. — `refactor: migrate feed-card and left-rail to token utilities`
- [ ] **5.** Apply the **Migration map** to `(public)/page.tsx`, `(platform)/feed/page.tsx`, and the modal/panel/toast components. Re-grep `\[var\(--|font-\[|duration-\[|#[0-9A-Fa-f]{3,6}` afterward — it should come back clean except the allowed exceptions noted above. — `refactor: migrate page-level arbitrary values to token utilities`
- [ ] **6.** Drop in `fixtures/motion.css` + `fixtures/responsive.css` + `fixtures/components-new.css` under `…/styles/design-system/`; add their imports to `globals.css` after `@theme`; point the §12.2 Framer Motion specs at the motion tokens; adopt the 1024/767 breakpoints. — `feat: vendor motion/responsive/new-component layers from design system`
- [ ] **7.** Verify dark mode (`prefers-color-scheme: dark`): no stuck dark-green badges/avatars; canvas/surface/border all flip. Verify **no horizontal scrollbar**, sidebar drops at 1024px, navbar → bottom tabs at 767px.
- [ ] **8.** `pnpm lint && pnpm type-check` green. Push the `fix/` branch and stop — maintainer reviews the Vercel preview.

## Guardrail for future work (prevents recurrence)

Add a lint rule (or `components.css` review note) flagging **arbitrary color/size values** in `className` — `*-[var(--color-*)]`, `text-[NNpx]`, raw `#hex` in `.tsx`/`.css`. Once `@theme` exists, those are code smells: a token utility should be used instead. This is what keeps "consistent design-system application" from drifting again.

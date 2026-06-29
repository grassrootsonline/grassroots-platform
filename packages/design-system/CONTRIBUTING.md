# Design System — Contributing Guide for Claude Design

This document describes how to make changes to the Grassroots design system going forward. The process changed after Amendment 06.

---

## Where things live

| What | Where |
|---|---|
| All design system CSS | `packages/design-system/` — this folder, directly |
| Binding style rules | `packages/design-system/CLAUDE.md` |
| Change history | `packages/design-system/CHANGELOG.md` |
| Visual prototypes (read-only reference) | `design-handoffs/core-social-mvp/prototypes/` |
| Historical amendments 01–06 | `design-handoffs/core-social-mvp/AMENDMENT-*.md` (archived, do not add to) |

**`packages/design-system/` is the single source of truth.** The `design-handoffs/` folder is now an archive — do not create new amendment files or fixture folders there.

---

## How to make a design system change

### 1. Branch

Branch from `development`:

```bash
git checkout development && git pull
git checkout -b design/<short-description>
```

Use `design/` as the branch prefix for design system work. Follow conventional commits: `feat:`, `fix:`, `chore:`, `docs:`.

### 2. Edit the CSS directly

Make changes to the relevant file(s) in `packages/design-system/`:

| File | When to edit |
|---|---|
| `tokens/colors.css` | Adding or changing colour tokens, including dark-mode overrides |
| `tokens/spacing.css` | Shadow tokens, border tokens, spacing scale, border radius, z-index |
| `tokens/typography.css` | Type scale, font families, weights, line heights |
| `components/components.css` | Core component classes (buttons, badges, avatars, cards, inputs, toasts) |
| `components-new.css` | Tabs, dropdowns, tooltips, command palette |
| `motion.css` | Duration tokens, easing curves, keyframes, animation utilities |
| `responsive.css` | Breakpoints, mobile nav, sheet pattern, touch targets |
| `CLAUDE.md` | Style rules and non-negotiables — update whenever rules change |

No fixture files. No separate amendment documents. The CSS **is** the amendment.

### 3. Update the style guide if rules changed

If the change introduces or modifies a design rule (not just a token value), update `packages/design-system/CLAUDE.md` in the same commit. The style guide must always reflect the current state.

### 4. Add a CHANGELOG entry

Open `packages/design-system/CHANGELOG.md` and add a new entry at the top, following the existing format:

```markdown
## [XX] — YYYY-MM-DD · Short title

Brief description of what changed and why. Focus on intent, not implementation.

**`file/changed.css`:**
- What was added or changed
- Old value → new value (for token changes)
- Why (dark mode, new pattern, spec alignment, etc.)

**Removals:** note anything deprecated or removed.
```

Include the entry in the same commit as the CSS change — not a separate commit.

### 5. Note app-level follow-up (if needed)

Some design system changes require follow-up in the app layer (`apps/web/`) — for example, a new token that replaces a hardcoded value in a CSS Module, or a new component class that app components should adopt. **Do not edit app files directly.** Instead, note the required follow-up at the bottom of your CHANGELOG entry:

```markdown
**App follow-up required:** Describe what needs to change in the app layer. The project advisor will create a handoff for Claude Code.
```

### 6. Push and stop

```bash
git push -u origin design/<short-description>
```

Do not merge to `development` or `main`. The maintainer reviews the Vercel preview and merges manually.

---

## Dark mode rule

Every colour token that has a different value in dark mode must have an override in **both** places:

1. `tokens/colors.css` — inside the `@media (prefers-color-scheme: dark)` block in `:root`
2. `apps/web/src/styles/globals.css` — inside the `:root[data-theme="dark"]` attribute block

The attribute block is what the dev theme switcher uses. If you only add the media query override, the switcher will show incorrect values on light-mode systems.

Shadow tokens are defined in `tokens/spacing.css` (light-mode values) and overridden in `tokens/colors.css` (dark-mode values) — this is intentional. Follow the same pattern for any future tokens that need dark-mode structural changes.

---

## What NOT to do

- Do not create files in `design-handoffs/core-social-mvp/` — that folder is an archive.
- Do not create a `fixtures/` subdirectory — the live CSS files are the fixture.
- Do not edit `apps/web/` files — note the required change in the CHANGELOG instead.
- Do not introduce new tokens without a CHANGELOG entry explaining their purpose and usage.
- Do not modify `CLAUDE.md` without updating the relevant token or component CSS to match.

---

## Summary

Before Amendment 06 (old process):
> Write `AMENDMENT-XX.md` with checklist and fixtures → Claude Code implements

After Amendment 06 (new process):
> Edit CSS directly → update CLAUDE.md if rules changed → add CHANGELOG entry → push branch → stop

# 010 — CLAUDE.md: process rules for design tokens, commits, and branch hygiene

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `docs` |
| **Branch** | `chore/claude-md-process-rules` |
| **Depends on** | none |

---

## Problem

Three process rules need to be codified in root `CLAUDE.md` so they are enforced on every Claude Code session going forward:

1. Hardcoded CSS values are explicitly prohibited — if a needed token does not exist, Claude Code must stop and request one before implementing.
2. Every git commit must have a descriptive title and a body comment.
3. Claude Code must verify its working branch is up to date before starting any task.

---

## Affected files

**Edited:**
- `CLAUDE.md` (root)

---

## Implementation steps

### Step 1 — Strengthen the CSS approach section

Find the existing bullet:

```
- **CSS Modules** (`*.module.css` co-located with components) for all component-scoped styles. Reference design system tokens via `var(--color-ink)`, `var(--space-md)`, `var(--border-default)` etc. — never hardcode values.
```

Replace with:

```
- **CSS Modules** (`*.module.css` co-located with components) for all component-scoped styles. Reference design system tokens via `var(--color-ink)`, `var(--space-md)`, `var(--border-default)` etc. **Hardcoded values are never allowed** — no raw px, hex, rgba, or numeric literals in any CSS Module or component style.
```

Then add a new paragraph after the existing bullet list in that section (before the next `##` heading):

```markdown
### Token requests — stop before hardcoding

If a component requires a value that has no design system token, **do not hardcode it**. Stop and raise a token request first:

1. Check `packages/design-system/tokens/` — the token may exist under a name you haven't encountered.
2. If no token covers the need, open a new handoff document in `handoffs/` addressed to `claude-design`, describing the component, the value needed, and why no existing token fits.
3. Wait for the token to be defined and merged before implementing the style.

The only exception is `font-size: 16px` on text inputs — this is a browser compatibility requirement (prevents iOS Safari zoom on focus) and must remain hardcoded.
```

---

### Step 2 — Add commit message rules to the Git workflow section

Find the existing Git workflow bullet:

```
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `perf:`, `docs:`). Keep CI green (lint + type-check + tests). Direct pushes to `main` are prohibited.
```

Replace with:

```
- Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `perf:`, `docs:`). Keep CI green (lint + type-check + tests). Direct pushes to `main` are prohibited.
- **Every commit must have both a title and a body.** The title follows Conventional Commits format. The body explains what changed and why — one or more sentences, written for a reviewer seeing only the commit log. A commit with a title only is not acceptable.

  ```
  fix: replace hardcoded shadow value in dropdown-menu

  --shadow-dropdown token was missing from spacing.css after the Amendment 07
  merge. Restoring the Amendment 06 two-layer value ensures dropdowns have
  correct elevation in light mode. Dark-mode override in colors.css was unaffected.
  ```
```

---

### Step 3 — Add branch freshness rule to the Git workflow section

Add a new bullet immediately before the Conventional Commits bullet (so it reads first in the workflow sequence):

```
- **Before starting any task, verify the working branch is up to date.** Run `git status` to confirm no unexpected changes, then `git pull origin <branch>` to pull latest from the remote. If the branch is behind, pull before touching any files. Never implement on a stale branch.
```

---

## Verification

- [ ] `CLAUDE.md` CSS approach section contains "Hardcoded values are never allowed" and the token request sub-section.
- [ ] `CLAUDE.md` Git workflow section contains the branch freshness rule as the first bullet.
- [ ] `CLAUDE.md` Git workflow section contains the commit body requirement with the example.
- [ ] No other content in `CLAUDE.md` was changed.
- [ ] `pnpm type-check` passes (docs-only change, should be trivially true).

Commit: `docs: add token request, commit body, and branch freshness rules to CLAUDE.md`

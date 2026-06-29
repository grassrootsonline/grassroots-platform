# 006 — Performance and layout fixes

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `fix/performance-layout` |
| **Depends on** | none |

---

## Problem

Three independent issues requiring no design token changes:

1. **Google Fonts loads via CSS `@import`** — a blocking resource in `globals.css`. The browser cannot begin font fetching until the stylesheet is parsed. The correct pattern is `<link>` tags in `<head>` with `rel="preconnect"`, which the browser resolves before parsing any CSS.

2. **Tabler Icons CDN pinned to `@latest`** — unpinned CDN dependencies will silently pick up breaking changes on the next deploy. The installed React package is `@tabler/icons-react@^3.19.0`; the webfont CDN should match that major version.

3. **Navbar uses `container-page` (960px) instead of `container-platform` (1080px)** — the navbar inner content is constrained to 960px while the platform shell below it is 1080px. On wide viewports the navbar content is narrower than the page content underneath it, causing visible misalignment.

---

## Background

`typography.css` already has a comment confirming the correct pattern: `<!-- <link href="..."> in your HTML <head> -->`. The design system anticipates `<link>` loading; the CSS `@import` in `globals.css` was the implementation diverging from spec.

The `container-page` / `container-platform` split was introduced in Amendment 02. The navbar component missed the update when `container-platform` was added.

---

## Affected files

**Edited:**
- `apps/web/src/app/layout.tsx` — add Google Fonts `<link>` tags, update Tabler CDN version
- `apps/web/src/styles/globals.css` — remove Google Fonts `@import`
- `apps/web/src/components/layout/navbar.tsx` — fix container class

---

## Token dependencies

None.

---

## Implementation steps

### Step 1 — Move Google Fonts from CSS @import to `<link>` tags

**In `apps/web/src/styles/globals.css`**, remove the first line entirely:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500&display=swap');
```

**In `apps/web/src/app/layout.tsx`**, the `<head>` currently contains only the Tabler icon `<link>`. Add three `<link>` tags for Google Fonts before the Tabler link:

```tsx
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500&display=swap"
  />
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css"
  />
</head>
```

Note the Tabler URL is updated in this same step (see Step 2).

Commit: `perf: move Google Fonts from CSS @import to <link> preconnect in layout`

---

### Step 2 — Pin Tabler Icons CDN to semver

The Tabler `<link>` is handled in Step 1 above — change `@latest` to `@3.19.0`:

```
Before: https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css
After:  https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css
```

This matches the installed `@tabler/icons-react@^3.19.0` in `apps/web/package.json`. Both packages ship from the same Tabler release and should stay in sync.

Include this change in the same commit as Step 1.

---

### Step 3 — Fix navbar container width

**In `apps/web/src/components/layout/navbar.tsx`**, line 23. Change:

```tsx
<div className={`container-page ${s.inner}`}>
```

to:

```tsx
<div className={`container-platform ${s.inner}`}>
```

Commit: `fix: align navbar inner width to container-platform (1080px)`

---

## Verification

- [ ] `globals.css` has no `@import` on line 1. The only remaining `@import` lines are the local design system imports.
- [ ] Root `layout.tsx` `<head>` has both `preconnect` links to `fonts.googleapis.com` and `fonts.gstatic.com`, then the stylesheet link, then the Tabler link.
- [ ] Tabler CDN URL contains `@3.19.0`, not `@latest`.
- [ ] On a wide viewport (≥1080px), navbar content and platform content below align to the same max-width edge.
- [ ] Fonts still render correctly (Inter and DM Serif Display load).
- [ ] `pnpm type-check` passes.

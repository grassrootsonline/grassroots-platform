# 016 — Fix remaining hardcoded values in waitlist page

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `fix` |
| **Branch** | `fix/waitlist-page-tokens` |
| **Depends on** | none (all required tokens already exist) |

---

## Context

Audit of the 015 merge found two hardcoded values in `(waitlisted)/waitlisted/page.module.css` that were missed because the 015 substitution table only listed `(auth)/page.module.css`. Both can be resolved with existing tokens — no new token request needed.

---

## Fix 1 — `.content { max-width: 480px }`

**File:** `apps/web/src/app/(waitlisted)/waitlisted/page.module.css` line 23

The waitlist page content block is deliberately wider than an auth panel (which resolved to `--panel-max-width: 440px`). Rather than misusing `--panel-max-width` for a semantically different element, use a scoped custom property on the rule itself:

```css
.content {
  --_content-max: 480px; /* Waitlist-specific centered content width — wider than auth panels */
  max-width: var(--_content-max);
  /* ... rest of existing styles unchanged ... */
}
```

This keeps the `480px` value visible and documented at the point of use without polluting the global token namespace for a one-off screen.

---

## Fix 2 — `.iconWrap { width: 56px; height: 56px }`

**File:** `apps/web/src/app/(waitlisted)/waitlisted/page.module.css` lines 39–40

The sage icon badge is `56px`. The avatar scale has `--avatar-lg: 48px` and `--avatar-xl: 72px` — neither is the right semantic match (this is a decorative icon wrap, not an avatar), and `--nav-height: 56px` would be semantically wrong to reuse here.

Same approach as Fix 1 — scope the value locally:

```css
.iconWrap {
  --_icon-badge: 56px; /* Waitlist icon badge — decorative, not an avatar */
  width: var(--_icon-badge);
  height: var(--_icon-badge);
  /* ... rest of existing styles unchanged ... */
}
```

---

## Verification

- [ ] Zero raw `px` values in `(waitlisted)/waitlisted/page.module.css` except `font-size: 16px` on any inputs (none in this file)
- [ ] Visual spot-check: waitlist page content width and icon badge size unchanged from before

Commit: `fix: replace remaining hardcoded values in waitlist page with scoped custom properties`

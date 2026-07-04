# Add noindex robots metadata to `/privacy` and `/terms` pending legal review

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `fix` |
| **Branch** | `fix/noindex-legal-pages-pending-review` |
| **Depends on** | none |

---

## Problem

`/privacy` and `/terms` (handoffs 027/028) render live, with an in-page banner from `LegalPageShell` stating the page "is pending legal review and is not launch-ready," and with real placeholder strings visible to any visitor (`[PLACEHOLDER: Legal Entity Name]`, `[PLACEHOLDER: Province, Canada]`, `[PLACEHOLDER: YYYY-MM-DD]`). Both pages currently have no `robots` directive — the app has no `robots.ts`/`sitemap.ts` at all — so nothing prevents a search engine from crawling and indexing either page in its current, admittedly-unfinished state.

Both handoff 027 and 028 included this exact verification item, which was never actually implemented:

> Page is excluded from anything that would index/publish it before Alex confirms legal review is complete (check with Alex before merging past `development`)

The repo's current checked-out branch is `main`, so — separate from the noindex gap — worth confirming with Alex directly whether these placeholder-content pages have already gone further than intended, or whether that's expected at this stage.

---

## Background

This is a narrow, mechanical gap: both pages already export `metadata` objects (`title` only, per Next.js's Metadata API, same pattern as root `apps/web/src/app/layout.tsx`). Adding a `robots` field to each is a two-line change with no design or architecture impact — it doesn't touch the pending legal-review status itself, it just keeps the unfinished copy out of search results until that review is done.

---

## Affected files

- `apps/web/src/app/(auth)/privacy/page.tsx` — add `robots` to the exported `metadata`
- `apps/web/src/app/(auth)/terms/page.tsx` — add `robots` to the exported `metadata`

---

## Token dependencies

None — metadata only, no styling or component changes.

---

## Implementation steps

1. **Add noindex metadata to `/privacy`**

   ```ts
   export const metadata = {
     title: 'Privacy policy — Grassroots',
     robots: { index: false, follow: false },
   }
   ```

   Commit: `fix(privacy): add noindex metadata pending legal review`

2. **Add noindex metadata to `/terms`**

   ```ts
   export const metadata = {
     title: 'Terms of service — Grassroots',
     robots: { index: false, follow: false },
   }
   ```

   Commit: `fix(terms): add noindex metadata pending legal review`

3. **Leave a clear removal marker**

   Add a one-line comment above each `robots` field: `// Remove once legal review is complete and legal.ts placeholders are filled in (handoffs 025–028).` This makes the eventual cleanup easy to find via grep rather than relying on memory.

   Commit: `docs: flag noindex metadata for removal after legal review`

---

## Verification

- [ ] View source (or check the rendered `<meta name="robots">` tag) on both `/privacy` and `/terms` — confirm `noindex, nofollow` is present.
- [ ] Confirm no other page's metadata was touched.
- [ ] `pnpm type-check` passes.
- [ ] Grep both files for `noindex removal` comment marker — confirms it's easy to find when legal.ts is finalized.

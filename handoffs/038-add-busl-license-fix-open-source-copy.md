# Add BUSL 1.1 LICENSE and correct the landing page's "open source" claim

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `high` |
| **Type** | `fix` |
| **Branch** | `chore/add-busl-license` |
| **Depends on** | none |

---

## Problem

The repo is public (`grassrootsonline/grassroots-platform`) and has no `LICENSE` file at all. Without one, the code is all-rights-reserved by default under copyright law regardless of the repo's visibility — nobody has any actual legal right to use, modify, or redistribute it, public repo or not.

This is worse than a gap: `apps/web/src/app/(auth)/page.tsx`'s landing page already **actively markets** the opposite:

```tsx
{/* ── Open source ── */}
...
<span className="text-label">Completely open source</span>
...
<h2 className={s.sectionHeading}>Built in public, for the public.</h2>
<p className={s.sectionBody}>
  Every line of code is visible, and open to contribution. A project built
  for the community, by the community.
</p>
```

This is live, user-facing copy making a specific legal claim that isn't true today.

---

## Background

Alex wants outside contributors able to read and contribute to the code, but does **not** want the project freely reusable to stand up a competing product. That rules out a true open-source license (MIT/Apache 2.0) — permitting competing commercial use is a defining feature of the OSI Open Source Definition, not an incidental detail. Alex chose the **Business Source License 1.1 (BUSL)**: source is public and contributable, production use is unrestricted *except* for a defined "competing use," and it auto-converts to a fully permissive license (Apache 2.0) after a fixed period. This is a source-available license, not an OSI open-source license — the landing copy has to say so honestly rather than claim "open source."

This handoff also folds in a small, related fix: the "View on GitHub" link in the same section has been sitting as an `href="#"` placeholder since handoff 029, deliberately deferred because repo visibility wasn't confirmed at the time. It's since been confirmed public (used repeatedly this cycle to review PRs directly). Nothing blocks wiring the real URL now.

**The Additional Use Grant's exact "competing use" wording, and the Licensor legal entity name, are not final** — same placeholder status as the privacy/terms pages (handoffs 025/026): pending real legal review before this ships as binding. Use the placeholder pattern below, consistent with `apps/web/src/constants/legal.ts`.

---

## Affected files

- `LICENSE` — new file, BUSL 1.1 text
- `apps/web/src/app/(auth)/page.tsx` — correct the "Open source" section copy; wire the real GitHub URL
- `README.md` — will reference the license once handoff 041 lands; no README change in this handoff (avoid ordering conflicts — 041 depends on this one)

---

## Implementation steps

1. **Add root `LICENSE`**

   Use the standard BUSL 1.1 template (MariaDB Corporation's canonical text, the one most BUSL adopters start from). Fill in:

   - **Licensor:** `[PLACEHOLDER: Legal Entity Name]` — same placeholder used in `apps/web/src/constants/legal.ts`, must be resolved together with the legal pages, not independently.
   - **Licensed Work:** `Grassroots Platform`
   - **Additional Use Grant:** `[PLACEHOLDER — pending legal review: intended to permit all production use except operating a competing social platform for AI builders as a commercial product or service offered to third parties. Exact language needs legal sign-off before this is enforceable.]`
   - **Change Date:** four years from this handoff's implementation date (calculate the literal date when implementing — do not leave "four years from now" as prose in the file).
   - **Change License:** `Apache License, Version 2.0`

   Add a one-line header comment above the license body: `<!-- Pending legal review — see handoffs/038. Additional Use Grant wording and Licensor name are placeholders. -->` (BUSL's canonical text is plain text, not Markdown — if the file is `LICENSE` with no extension, use a plain-text comment format instead, e.g. a bracketed note at the top of the file rather than an HTML comment).

   Commit: `chore: add BUSL 1.1 LICENSE (pending legal review)`

2. **Correct the "Open source" section copy in the landing page**

   Replace:

   ```tsx
   <span className="text-label">Completely open source</span>
   ...
   <h2 className={s.sectionHeading}>Built in public, for the public.</h2>
   <p className={s.sectionBody}>
     Every line of code is visible, and open to contribution. A project built
     for the community, by the community.
   </p>
   ```

   With:

   ```tsx
   <span className="text-label">Source available</span>
   ...
   <h2 className={s.sectionHeading}>Built in public, for the public.</h2>
   <p className={s.sectionBody}>
     The full source is public and open to contribution. Not a permissive
     open-source license — see our LICENSE for what that means in practice.
   </p>
   ```

   Commit: `fix(landing): correct "open source" claim to "source available"`

3. **Wire the real GitHub URL**

   Replace the placeholder:

   ```tsx
   {/* href intentionally "#" — repo visibility not yet confirmed (handoff 029) */}
   <a href="#" className={s.sectionLink}>
   ```

   With:

   ```tsx
   <a href="https://github.com/grassrootsonline/grassroots-platform" className={s.sectionLink} target="_blank" rel="noopener noreferrer">
   ```

   Leave the "Contribute" and "Careers" placeholder links untouched — they're out of scope here (029 deferred them for unrelated reasons: no CONTRIBUTING.md yet for the former, no careers page built for the latter).

   Commit: `fix(landing): link "View on GitHub" to the real public repo`

---

## Verification

- [ ] `LICENSE` exists at repo root with BUSL 1.1 terms, placeholder Licensor/Additional Use Grant clearly marked, and a concrete calculated Change Date (not relative prose).
- [ ] Landing page no longer contains the string "Completely open source" or "open source" as an unqualified claim — grep `apps/web/src/app/(auth)/page.tsx` for `open source` case-insensitive, confirm only "source available"/"source is public" phrasing remains.
- [ ] "View on GitHub" link points to `https://github.com/grassrootsonline/grassroots-platform`, opens in a new tab.
- [ ] "Contribute" and "Careers" links unchanged (still `#`).
- [ ] `pnpm type-check` passes.

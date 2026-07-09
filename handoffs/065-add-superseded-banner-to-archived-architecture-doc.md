# Add a self-announcing "moved" banner to the archived ARCHITECTURE.md

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `low` |
| **Type** | `chore` |
| **Branch** | `chore/archive-banner-old-architecture-doc` |
| **Depends on** | none |

---

## Problem — correcting my own mistake first

I told Alex the architecture doc mandates "service role key only, never anon key server-side" and that `middleware.ts`'s account-status lookup (anon key + RLS, via `@supabase/ssr`) contradicts it. That was wrong, and worth stating plainly rather than quietly fixing: I quoted `design-handoffs/core-social-mvp/ARCHITECTURE.md`, which is an **archived, pre-implementation draft** — `design-handoffs/CLAUDE.md` already says explicitly (line 19): *"`ARCHITECTURE.md` has moved to `docs/ARCHITECTURE.md`. These files are kept for reference only."* I didn't check that index before quoting the file's content directly.

The real, current `docs/ARCHITECTURE.md` already describes the correct, implemented pattern accurately: §8 states *"The service role key bypasses RLS. It is used only in Supabase Edge Functions and server-side jobs. Never in client-side code"* — which does not conflict with `middleware.ts` using the anon key server-side, scoped to the user's own session via cookies. That's the standard `@supabase/ssr` SSR pattern (Supabase's own recommended approach for validating a session and reading RLS-scoped data about "the current user"), and it's arguably the more secure choice here — RLS gives a real defense-in-depth boundary that a service-role query would have to enforce entirely through application code instead. **There is no code-vs-doc drift to fix. The code and the current doc already agree.**

What's actually worth fixing: `design-handoffs/core-social-mvp/ARCHITECTURE.md` doesn't announce its own archived status anywhere *inside the file* — only the folder's `CLAUDE.md` index says it moved. Someone (or some agent) searching file contents directly, the way I just did, can land inside the stale file without ever seeing the index that explains it's superseded. Cheap, worthwhile fix: make the file say so itself.

---

## Affected files

- `design-handoffs/core-social-mvp/ARCHITECTURE.md` — add a banner at the very top

---

## Implementation steps

Add this immediately after the existing title/version header (the `# Grassroots — Principal Architecture Document` / version line at the top of the file), before the Table of Contents:

```markdown
> **⚠ This document has moved.** This is the original pre-implementation draft, kept for historical reference only. The current, authoritative architecture document is [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) — it reflects what's actually built, including sections (like RLS/service-role key usage, connection pooling) that have been refined since this draft was written. Do not treat this file as current.
```

Adjust the relative link path if needed to resolve correctly from this file's location. No other content in this file needs to change — this is purely an in-file pointer, not a content rewrite (the folder's `CLAUDE.md` index already governs which file is authoritative; this just makes that fact visible from inside the file itself).

Commit: `docs: add superseded banner to archived pre-implementation ARCHITECTURE.md`

---

## Verification

- [ ] The banner renders correctly at the top of `design-handoffs/core-social-mvp/ARCHITECTURE.md` and the relative link to `docs/ARCHITECTURE.md` resolves.
- [ ] No other content in the file changed.

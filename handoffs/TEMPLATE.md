# [Short title — imperative verb phrase, e.g. "Fix hardcoded scrim colours"]

| Field | Value |
|---|---|
| **Recipient** | `claude-code` or `claude-design` |
| **Priority** | `critical` / `high` / `medium` / `low` |
| **Type** | `fix` / `refactor` / `feature` / `token-request` |
| **Branch** | `fix/<slug>` or `feat/<slug>` (Claude Code only) |
| **Depends on** | List any handoffs or amendments that must land first, or `none` |

---

## Problem

_What is wrong, and what breaks or looks incorrect because of it. Be specific — name the file, selector, or component._

---

## Background

_Why this matters. Reference the design system rule, architecture principle, or user-facing impact._

---

## Affected files

_Complete list of files Claude Code is permitted to touch. Do not touch any file not listed here._

- `path/to/file.css` — what to change
- `path/to/other.tsx` — what to change

---

## Token dependencies

_List any design tokens this work requires. State whether each is already defined, provisional (define as specified below and mark with a `/* provisional */` comment), or pending Claude Design (do not implement until the amendment lands)._

| Token | Status | Provisional value (if applicable) |
|---|---|---|
| `--example-token` | `defined` / `provisional` / `pending` | `value or n/a` |

---

## Implementation steps

_Numbered, ordered. Each step should be a single logical change — one commit. Be precise: include the exact selector, property, old value, and new value where it adds clarity. End each step with its commit message._

1. **Step title**

   Description of the change. Include code snippets where exact values matter.

   Commit: `type: short description`

2. **Step title**

   …

---

## Verification

_How to confirm the implementation is correct. Phrased as checkboxes Claude Code can tick._

- [ ] Verification item
- [ ] Verification item
- [ ] Grep for the old hardcoded value — confirm zero results in the affected files

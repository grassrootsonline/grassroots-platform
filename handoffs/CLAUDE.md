# Handoffs

This folder contains task documents authored by the project advisor (Claude Cowork).
It is **distinct from `design-handoffs/`**, which carries design system amendments produced by Claude Design.

Each document specifies a `recipient` in its header — either `claude-code` (implementation task) or `claude-design` (design/token decision). Read that field first; if the document is not addressed to you, ignore it.

This file does **not** restate or override any rules from the root `CLAUDE.md` or `packages/design-system/CLAUDE.md`. Those files remain authoritative on engineering standards, visual style, git workflow, and coding conventions. This file only describes how to process documents in this folder.

---

## For Claude Code

When you find a handoff in this folder addressed to you:

1. **Read the entire document before writing any code.** Scope, dependencies, and affected files are all stated — do not infer beyond what is written.
2. **Check Token dependencies.** If a token is marked `provisional`, define it exactly as specified in the handoff. If marked `pending Claude Design`, do not implement that item until the corresponding Claude Design amendment lands in `design-handoffs/`.
3. **Branch from `development`** using the name in the `Branch` field (e.g. `fix/hardcoded-design-tokens`). Follow the branching and commit rules in the root `CLAUDE.md`.
4. **Implement exactly what is described.** Do not expand scope. Do not touch files not listed in **Affected files**.
5. **Commit each logical group** using conventional commit messages as specified in each implementation step.
6. **Push the branch. Stop.** Do not open a PR, do not merge to `development` or `main`.

### Conflict resolution

If a handoff instruction appears to conflict with the root `CLAUDE.md` or `packages/design-system/CLAUDE.md`, the conflict is an error in the handoff — follow the canonical source. Leave a `/* HANDOFF CONFLICT: … */` comment in the relevant file noting the discrepancy so the advisor can correct it in a follow-up.

---

## For Claude Design

Handoffs addressed to `claude-design` are token or pattern requests from the advisor. Read the document to understand what is being requested, then produce an amendment file in `design-handoffs/core-social-mvp/` following the template at `design-handoffs/AMENDMENT-TEMPLATE.md`.

---

## Document format

See `TEMPLATE.md` in this folder for the standard handoff structure.

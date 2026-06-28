# Grassroots — design handoffs

This folder is the **contract between visual design and engineering**. Designs are created and iterated as interactive prototypes, then handed off here for Claude Code to implement in this repo. The shape is fixed so every handoff is consumed the same way.

## Folder layout

```
design-handoffs/
  README.md                  ← you are here (the convention)
  CLAUDE.md                  ← commit this as /CLAUDE.md at the repo root
  AMENDMENT-TEMPLATE.md      ← copy when iterating on a shipped screen
  <feature>/                 ← one folder per feature handoff
    README.md                ← the build spec (binding)
    ARCHITECTURE.md          ← reference copy of the principal architecture doc
    prototypes/              ← standalone offline HTML design references
```

## How a handoff is consumed

For any feature folder, the instruction to Claude Code is always the same one line:

> Implement `design-handoffs/<feature>/` per its README, on a branch.

Claude Code then:
1. Reads `packages/design-system/CLAUDE.md` (the in-repo binding style guide) for visual style.
2. Reads the feature `README.md` (spec) + opens the `prototypes/` for look and behavior.
3. Builds on a `feature/<feature>` branch off `development`, commits with Conventional Commits, pushes, and **stops** — no merge to `main`, no PR. You review the Vercel preview and merge manually.

## Iterating

- **New screen / new feature** → a new `<feature>/` folder with a full README spec.
- **Tweak to a screen that already exists** → copy `AMENDMENT-TEMPLATE.md` into the feature folder as `AMENDMENT-NN-<short>.md` and describe only what changed. Smaller diffs, cleaner reviews.

## Active handoffs

- `core-social-mvp/` — landing + auth, feed, profile, thread, composer, navigation, notifications. (Primary build target: `prototypes/02-app-feed-profile-thread-composer.html`.)

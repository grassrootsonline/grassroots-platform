# Write a real README.md

| Field | Value |
|---|---|
| **Recipient** | `claude-code` |
| **Priority** | `medium` |
| **Type** | `feature` |
| **Branch** | `docs/write-readme` |
| **Depends on** | `038-add-busl-license-fix-open-source-copy.md`, `039-introduce-staging-environment-tier.md`, `040-split-architecture-doc-current-vs-roadmap.md` — the README references the license, branch model, and ARCHITECTURE/ROADMAP split introduced by those three. Land this last. |

---

## Problem

`README.md` is currently two lines:

```markdown
# grassroots-platform
The primary Repository for the grassroots social platform.
```

The repo is public. This is the first thing anyone lands on.

---

## Background

Alex's call: this is a **public-facing project introduction** — written for an outside visitor or potential contributor landing on the repo, not an internal onboarding doc. It should say what Grassroots is, its current status, the tech stack, how to run it locally, and link out to `docs/ARCHITECTURE.md` / `docs/ROADMAP.md` / `LICENSE` for depth rather than duplicating them.

**One open item Claude Code should NOT resolve unilaterally:** whether to publicly describe the `handoffs/` process (Claude Code / Claude Design / advisor workflow) as part of "how this repo is built." The README below deliberately keeps the contributing section generic and does not disclose that internal workflow — that's a disclosure decision for Alex, not a default to assume. If a fuller public contributing guide is wanted later, that's a separate handoff (and probably a `CONTRIBUTING.md`, not README content).

---

## Affected files

- `README.md` — full rewrite

---

## Implementation steps

1. **Replace `README.md` with the following content in full**, adjusting only the two bracketed items noted inline (domain/URL and current waitlist framing) if they've changed by the time this is implemented:

   ```markdown
   # Grassroots

   The social platform for AI builders — a home for developers, founders, researchers, and curious tinkerers to share what they're building, connect with people doing the same, and get their work seen.

   Grassroots is in **early access**. New accounts join a waitlist and are activated manually as capacity allows.

   ## Status

   This is an actively-developed, pre-launch platform. The core auth/waitlist flow and user profiles are live; most of the social product (posts, projects, communities, articles, messaging) is designed but not yet built. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for what's actually implemented today, and [`docs/ROADMAP.md`](docs/ROADMAP.md) for what's planned.

   ## Tech stack

   | Layer | Technology |
   |---|---|
   | Framework | Next.js 15 (App Router, React Server Components, Server Actions) |
   | Language | TypeScript, strict mode |
   | Styling | Native CSS + CSS Modules, design-system tokens — no utility framework |
   | Database | Supabase (PostgreSQL, Auth, Storage) |
   | ORM | Drizzle |
   | Deployment | Vercel |
   | Package manager | pnpm workspaces (Turborepo monorepo) |

   Full rationale and the complete current architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

   ## Local development

   ```bash
   pnpm install
   cp .env.example .env.local
   ```

   Fill in `.env.local` with your own Supabase project credentials, or set `USE_SEED_DATA=true` to run entirely against deterministic seed data with no external services (no real Supabase project needed — this is the fastest way to get the app running locally).

   ```bash
   pnpm dev
   ```

   ## Branching

   Changes flow `feature/*` → `development` (seeded data) → `staging` (closed testing, isolated live backend) → `main` (production). See [`CLAUDE.md`](CLAUDE.md) for the full workflow.

   ## License

   Grassroots is source-available under the [Business Source License 1.1](LICENSE) — free to read, run, and contribute to. It is not a permissive open-source license: standing up a competing commercial product from this code isn't permitted under the license's Additional Use Grant. It converts to Apache 2.0 on the Change Date specified in [`LICENSE`](LICENSE).

   ## Contributing

   Issues and pull requests are welcome. Please read [`LICENSE`](LICENSE) before contributing so you know the terms your contribution is made under.
   ```

   Commit: `docs: write real README.md`

---

## Verification

- [ ] `README.md` renders correctly on GitHub (headings, code blocks, table, links all valid relative paths).
- [ ] All linked files (`docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `CLAUDE.md`, `LICENSE`) exist at the paths referenced — confirm handoffs 038/039/040 have actually landed first.
- [ ] `.env.example` matches what the "Local development" section describes (it should, per handoff 039's step 6 update — reconfirm at implementation time).
- [ ] No mention of the internal `handoffs/`, Claude Code, or Claude Design workflow anywhere in the public README.

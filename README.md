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

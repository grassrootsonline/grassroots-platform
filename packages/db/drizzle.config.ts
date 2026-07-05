import { defineConfig } from 'drizzle-kit';

// This file is only used by the Drizzle Kit CLI (db:push / db:generate),
// run locally from a developer's machine — never by the deployed app.
// DATABASE_URL here can safely be the direct connection string. Do not
// confuse this with the DATABASE_URL used by packages/db/src/index.ts at
// app runtime, which must be the transaction pooler string in any
// deployed (Vercel) environment — see .env.example.
export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

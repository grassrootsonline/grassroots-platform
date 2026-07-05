#!/usr/bin/env node
// Verifies every route under apps/web/src/app is explicitly classified in
// apps/web/src/middleware.ts as PUBLIC_PATHS or GATED_PATHS. Fails (exit 1)
// if a route exists that isn't accounted for in either list. Run via
// `pnpm check:routes`; wired as a pre-commit hook (.husky/pre-commit) so a
// new route can't be committed without an access-level decision.
//
// Known, expected exceptions (not bugs if flagged as "stale" below):
//   - /auth/callback is a route.ts Route Handler, not a page.tsx, so it's
//     never "discovered" by this script but is legitimately in PUBLIC_PATHS.
//   - /waitlisted is in GATED_PATHS for documentation, even though
//     middleware() also has its own separate startsWith('/waitlisted') check.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const APP_DIR = join(process.cwd(), 'apps/web/src/app');
const MIDDLEWARE_PATH = join(process.cwd(), 'apps/web/src/middleware.ts');
const EXPECTED_EXTRAS = new Set(['/auth/callback', '/waitlisted']);

function findPageFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...findPageFiles(full));
    } else if (entry === 'page.tsx') {
      results.push(full);
    }
  }
  return results;
}

function toRoutePath(pageFile) {
  const rel = relative(APP_DIR, pageFile).split(sep);
  rel.pop(); // drop 'page.tsx'
  const segments = rel
    .filter((seg) => !(seg.startsWith('(') && seg.endsWith(')'))) // strip route groups
    .map((seg) => (seg.startsWith('[') && seg.endsWith(']') ? ':param' : seg));
  const path = '/' + segments.join('/');
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

function normalize(path) {
  return path.replace(/\[[^\]]+\]/g, ':param').replace(/\/$/, '') || '/';
}

function extractArray(source, name) {
  const re = new RegExp(`const ${name}\\s*=\\s*\\[([^\\]]*)\\]`, 's');
  const match = source.match(re);
  if (!match) {
    throw new Error(`Could not find "${name}" array in middleware.ts — has it been renamed?`);
  }
  return match[1]
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

const discoveredRoutes = new Set(findPageFiles(APP_DIR).map(toRoutePath).map(normalize));

const middlewareSource = readFileSync(MIDDLEWARE_PATH, 'utf-8');
const publicPaths = extractArray(middlewareSource, 'PUBLIC_PATHS').map(normalize);
const gatedPaths = extractArray(middlewareSource, 'GATED_PATHS').map(normalize);
const known = new Set([...publicPaths, ...gatedPaths]);

const unclassified = [...discoveredRoutes].filter((r) => !known.has(r));
const stale = [...known].filter((r) => !discoveredRoutes.has(r) && !EXPECTED_EXTRAS.has(r));

let hasError = false;

if (unclassified.length > 0) {
  hasError = true;
  console.error('\n✖ Found route(s) not classified in middleware.ts:\n');
  unclassified.forEach((r) => console.error(`  ${r}`));
  console.error(
    '\nAdd each to PUBLIC_PATHS (readable by logged-out/non-active visitors) or\n' +
    'GATED_PATHS (requires an active session) in apps/web/src/middleware.ts,\n' +
    'then re-run `pnpm check:routes`.\n'
  );
}

if (stale.length > 0) {
  console.warn('\n⚠ middleware.ts lists path(s) with no matching route (not blocking):\n');
  stale.forEach((r) => console.warn(`  ${r}`));
  console.warn('\nRemove these from PUBLIC_PATHS/GATED_PATHS if the route was deleted.\n');
}

if (hasError) {
  process.exit(1);
}

console.log(`✓ All ${discoveredRoutes.size} route(s) are explicitly classified in middleware.ts.`);

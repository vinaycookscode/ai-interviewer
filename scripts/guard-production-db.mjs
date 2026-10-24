// Refuse to run local development or migrations against the production database.
//
//   node scripts/guard-production-db.mjs dev    # before `next dev`
//   node scripts/guard-production-db.mjs build  # before `prisma migrate deploy`
//
// Allowed anyway on Vercel Production (VERCEL_ENV=production) or with
// ALLOW_PRODUCTION_DB=1 for a deliberate one-off.

// Neon endpoint of the production branch (see docs/ENVIRONMENT_SETUP.md).
const PRODUCTION_DB_ENDPOINTS = ["ep-delicate-firefly-adjnzpid"];

const mode = process.argv[2];
if (mode !== "dev" && mode !== "build") {
    console.error("Usage: node scripts/guard-production-db.mjs <dev|build>");
    process.exit(2);
}

// Resolve DATABASE_URL the way the guarded command will: `next dev` lets
// .env.local override .env; Prisma (prisma.config.ts) reads .env only.
// Neither overrides a variable that is already set.
if (mode === "dev") {
    const { createRequire } = await import("node:module");
    const { loadEnvConfig } = createRequire(import.meta.url)("@next/env"); // CommonJS package
    loadEnvConfig(process.cwd(), true, { info() {}, error: console.error });
} else {
    await import("dotenv/config");
}

let host = "";
try {
    host = new URL(process.env.DATABASE_URL ?? "").host;
} catch {
    // Missing or unparseable: nothing to guard (the build checks presence separately).
}

const isProduction = PRODUCTION_DB_ENDPOINTS.some((endpoint) => host.includes(endpoint));
const allowed = process.env.ALLOW_PRODUCTION_DB === "1" || process.env.VERCEL_ENV === "production";

if (isProduction && !allowed) {
    const action = mode === "dev" ? "start the dev server" : "run `prisma migrate deploy`";
    console.error(`
✖ Refusing to ${action} against the PRODUCTION database (${host}).

  Point DATABASE_URL at the development branch (ep-flat-paper) in .env.local,
  or, if you really mean it, re-run with ALLOW_PRODUCTION_DB=1.
  See docs/ENVIRONMENT_SETUP.md.
`);
    process.exit(1);
}

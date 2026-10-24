// Fail the build early when DATABASE_URL is missing.
//
// prisma.config.ts falls back to localhost so `prisma generate` (postinstall)
// works without a database. `prisma migrate deploy` would then fail with a
// confusing "P1001: Can't reach database server at localhost:5432".
import "dotenv/config";

if (!process.env.DATABASE_URL) {
    const environment = process.env.VERCEL_ENV ? ` (Vercel ${process.env.VERCEL_ENV})` : "";
    console.error(`
✖ DATABASE_URL is not set${environment}.

  The build runs \`prisma migrate deploy\`, which needs the target database.
  Set DATABASE_URL for this environment, e.g. in Vercel:
  Settings → Environment Variables → DATABASE_URL (scoped to Production or Preview).
  See docs/ENVIRONMENT_SETUP.md.
`);
    process.exit(1);
}

---
description: Change the Prisma schema with a migration
---

# Database Sync

Update the database after schema changes in `prisma/schema.prisma`. The project uses migrations; **never run `prisma db push`**, which can drop data (see `docs/architecture/2026-10-24-switch-to-prisma-migrations.md`).

Work against a development or throwaway database, never production (`docs/LOCAL_DEVELOPMENT.md`).

## Steps

1. Create and apply a migration locally (this also regenerates the Prisma client):
   ```bash
   npx prisma migrate dev --name describe_the_change
   ```

2. Commit the new folder in `prisma/migrations/` together with the schema change.

3. Deploys apply it automatically: `npm run build` runs `prisma migrate deploy` against that environment's database.

4. (Optional) Seed plans and feature flags on a fresh database:
   ```bash
   npx tsx scripts/seed-subscription-plans.ts
   node scripts/seed-features.js
   ```

## Only regenerate the client

After pulling someone else's schema change:
```bash
npx prisma generate
```

## View Database

Open Prisma Studio to view/edit data:
```bash
npx prisma studio
```

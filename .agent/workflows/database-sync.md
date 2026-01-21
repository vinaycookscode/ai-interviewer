---
description: Sync Prisma schema with database
---

# Database Sync

Update database after schema changes in prisma/schema.prisma.

## Steps

// turbo
1. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

// turbo
2. Push schema changes to database:
   ```bash
   npx prisma db push
   ```

3. (Optional) Seed database:
   ```bash
   npx prisma db seed
   ```

## For Migrations (Production)

1. Create migration:
   ```bash
   npx prisma migrate dev --name migration_name
   ```

2. Apply migration:
   ```bash
   npx prisma migrate deploy
   ```

## View Database

Open Prisma Studio to view/edit data:
```bash
npx prisma studio
```

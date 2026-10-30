# Vercel Deployment Guide

## Quick Deploy

### Option 1: Using the Deployment Script (Recommended)
```bash
npm run deploy
```

This will:
1. Check for Vercel CLI installation
2. Run a local build to catch errors
3. Prompt you to choose between production or preview deployment
4. Deploy to Vercel

### Option 2: Direct Commands
```bash
# Deploy to preview
npm run deploy:preview

# Deploy to production
npm run deploy:prod
```

### Option 3: Manual Deployment
```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Deploy preview
vercel

# Deploy production
vercel --prod
```

## First-Time Setup

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Link Project
```bash
vercel link
```

### 4. Set Environment Variables
Set them in the Vercel dashboard, scoped per environment. The full table, with production and preview values, is in [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md):

| Area | Variables |
|---|---|
| Database | `DATABASE_URL` (Production and Preview each get their own Neon branch) |
| Auth | `AUTH_SECRET`, `AUTH_URL` (the older `NEXTAUTH_URL` also works) |
| AI | `GEMINI_API_KEY` |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Scheduled jobs | `CRON_SECRET`: Vercel Cron sends it to `/api/cron/weekly-report` (AIIN-103) |
| Code judge | `JUDGE0_URL`, `JUDGE0_KEY`: hosted Judge0 runs candidates' code (AIIN-105) |
| Storage | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| Payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (test-mode keys on Preview) |
| URLs | `NEXT_PUBLIC_APP_URL`, `APP_URL` (optional) |

## Database

The project uses **Neon**, with one branch per environment (production: `ep-delicate-firefly`, development: `ep-flat-paper`).

**Schema changes**
- Make them with `npx prisma migrate dev --name <change>` and commit the migration.
- Every build applies pending migrations with `prisma migrate deploy`.
- Never use `prisma db push`: it can drop data (see the [migrations ADR](docs/architecture/2026-10-24-switch-to-prisma-migrations.md)).

**Checks before `migrate deploy`**
- The build stops if `DATABASE_URL` is missing.
- It stops if a non-production build points at the production database.
- On a laptop, this means `npm run build` refuses the production URL in `.env`. That's on purpose; see [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md).

## Deployment Workflow

### Local → Production

There's no preview environment for now ([ADR](docs/architecture/2026-10-28-no-preview-environment.md)). Check every change locally, then release by merging `develop` into `main`.

1. **Make changes locally**
   ```bash
   npm run dev
   ```

2. **Test locally** (on a development or throwaway database, never production: see [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md))
   - Verify all features work
   - Check light **and** dark, from 320px phones to desktop
   - Test authentication

3. **Release to production**
   ```bash
   git switch main && git merge --ff-only develop && git push origin main
   ```
   - Pushing `main` deploys to production (or run `npm run deploy:prod`)
   - Then run the post-deployment checklist below

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Run `npm run build` locally to catch errors early

### "DATABASE_URL is not set"
The build checks this before migrating. Add `DATABASE_URL` for Production in Vercel. A Preview build showing this is expected while there's no preview environment; skip those builds with Vercel's Ignored Build Step.

### "Refusing to run `prisma migrate deploy` against the PRODUCTION database"
A non-production build (Preview, or a local `npm run build`) is pointing at the production Neon branch. Point it at the development branch. Override with `ALLOW_PRODUCTION_DB=1` only for a deliberate one-off.

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Check that migrations applied: `prisma migrate deploy` prints each one in the build log

### Environment Variables Not Working
- Make sure variables are set in Vercel dashboard
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Useful Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Remove a deployment
vercel rm [deployment-url]

# Pull environment variables from Vercel
vercel env pull
```

## Automatic Deployments (Git Integration)

If you've connected your GitHub repository to Vercel:
- **Push to main branch** → Automatic production deployment
- **Push to other branches or open a pull request** → Vercel starts a Preview build, which stops at the `DATABASE_URL` check while there's no preview environment

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Migrations applied (build log shows `prisma migrate deploy` succeeded)
- [ ] Test authentication: sign up, sign in, password reset
- [ ] Test AI interview flow (Gemini)
- [ ] Test email notifications (Resend)
- [ ] Locally, before release: a payment change is checked with Razorpay **test-mode** keys and the webhook test (see `docs/LOCAL_DEVELOPMENT.md`)
- [ ] Candidate documents open through `/api/files/…` for the right people, and are refused for others
- [ ] R2 bucket public access is off (AIIN-113)
- [ ] Light and dark both work, on a phone and on desktop
- [ ] Test PDF export functionality
- [ ] Verify database connections
- [ ] Check analytics dashboard

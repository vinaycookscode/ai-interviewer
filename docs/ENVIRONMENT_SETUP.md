# Environment Setup Guide

This project uses separate environments for development and production.

## Branch → Environment Mapping

| Git Branch | Environment | Database Branch | Vercel Environment |
|------------|-------------|-----------------|-------------------|
| `main`     | Production  | `production`    | Production        |
| `develop`  | Development | `development`   | Preview           |

## Neon Database Branches

- **Production**: `ep-delicate-firefly-adjnzpid.c-2.us-east-1.aws.neon.tech`
- **Development**: `ep-flat-paper-adc7d7ci.c-2.us-east-1.aws.neon.tech`

## Vercel Environment Variables Setup

### Step 1: Go to Vercel Dashboard
1. Navigate to [vercel.com](https://vercel.com)
2. Select your project → **Settings** → **Environment Variables**

### Step 2: Configure DATABASE_URL

Add `DATABASE_URL` **twice** with different scopes:

**For Production:**
- Variable: `DATABASE_URL`
- Value: `postgresql://neondb_owner:YOUR_PASSWORD@ep-delicate-firefly-adjnzpid.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Check: ✅ Production only

**For Preview:**
- Variable: `DATABASE_URL`
- Value: `postgresql://neondb_owner:YOUR_PASSWORD@ep-flat-paper-adc7d7ci.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
- Check: ✅ Preview only

### Step 3: Configure Branch Deployments
1. Go to **Settings** → **Git**
2. Set **Production Branch** to `main`
3. Preview deployments will automatically use all other branches (including `develop`)

### Other Environment Variables

Set these for BOTH Production and Preview:
- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `R2_*` variables

Set these with DIFFERENT values per environment:
- `NEXTAUTH_URL` - Production: `https://getbacktou.com`, Preview: `https://your-preview.vercel.app`
- `NEXT_PUBLIC_APP_URL` - Same as NEXTAUTH_URL

## Resetting Development Database

To sync development with production data:

```bash
neonctl branches reset br-aged-feather-adtfd3nk --project-id silent-voice-80918405 --parent
```

## Local Development

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

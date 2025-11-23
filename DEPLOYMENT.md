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
Go to your Vercel dashboard and add these environment variables:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (use Vercel Postgres or external provider)

- `GEMINI_API_KEY` - Google Gemini API key
- `RESEND_API_KEY` - Resend API key for emails
- `RESEND_FROM_EMAIL` - Email address for sending (e.g., `noreply@yourdomain.com`)
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., `https://your-app.vercel.app`)

## Database Setup for Production

### Option 1: Vercel Postgres (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the `DATABASE_URL` to your environment variables
4. The database will be automatically provisioned

### Option 2: External PostgreSQL
Use any PostgreSQL provider (Supabase, Railway, Neon, etc.) and add the connection string to `DATABASE_URL`.

## Deployment Workflow

### Development → Preview → Production

1. **Make changes locally**
   ```bash
   npm run dev
   ```

2. **Test locally**
   - Verify all features work
   - Check dark theme
   - Test authentication

3. **Deploy preview**
   ```bash
   npm run deploy:preview
   ```
   - Get a unique preview URL
   - Test in production-like environment
   - Share with team for review

4. **Deploy to production**
   ```bash
   npm run deploy:prod
   ```
   - Updates your main production URL
   - Available to all users

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Ensure all environment variables are set
- Run `npm run build` locally to catch errors early

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check if database allows connections from Vercel IPs
- Ensure Prisma migrations are applied

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
- **Push to other branches** → Automatic preview deployment
- **Pull requests** → Automatic preview deployment with unique URL

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test authentication (Custom Auth.js)
- [ ] Test AI interview flow (Gemini)
- [ ] Test email notifications (Resend)
- [ ] Check dark theme works correctly
- [ ] Test PDF export functionality
- [ ] Verify database connections
- [ ] Check analytics dashboard

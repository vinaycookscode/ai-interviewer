---
description: Deploy to production from main branch
---

# Deploy to Production

Deploy to production environment on Vercel.

## Steps

1. Ensure you're on develop branch and it's up to date:
   ```bash
   git checkout develop
   git pull
   ```

2. Run full build to verify no errors:
   ```bash
   npm run build
   ```

3. Merge develop into main:
   ```bash
   git checkout main
   git pull
   git merge develop
   ```

4. Push to main (triggers production deploy):
   ```bash
   git push origin main
   ```

5. Switch back to develop:
   ```bash
   git checkout develop
   ```

## ⚠️ Pre-deployment Checklist
- [ ] All features tested in preview
- [ ] No console errors
- [ ] Light/dark mode working
- [ ] Build passes locally

---
description: Create a new feature branch and start development
---

# New Feature Development

Start working on a new feature with proper branching.

## Steps

1. Ensure develop is up to date:
   ```bash
   git checkout develop
   git pull
   ```

2. Create feature branch (replace `feature-name` with actual name):
   ```bash
   git checkout -b feature/feature-name
   ```

3. Make your changes

// turbo
4. Verify build works:
   ```bash
   npm run build
   ```

5. Commit changes with conventional commit message:
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

6. Push feature branch:
   ```bash
   git push -u origin feature/feature-name
   ```

## Commit Message Format
- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring

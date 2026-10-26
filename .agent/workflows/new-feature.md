---
description: Create a new feature branch and start development
---

# New Feature Development

Start working on a new feature with proper branching. The rules behind each step are in `AGENTS.md`.

## Steps

1. Find or create the ticket in Kaam (project AIIN) and move it to **In Progress**.

2. Ensure develop is up to date:
   ```bash
   git checkout develop
   git pull
   ```

3. Create feature branch (replace `feature-name` with actual name):
   ```bash
   git checkout -b feature/feature-name
   ```

4. **UI work: design first.** A new or redesigned screen needs an approved artboard on the [design canvas](https://claude.ai/artifact/Q1hFq3HP7UtDQ34dRQ17uQ) before you build it (`docs/architecture/2026-10-25-design-first-on-the-canvas.md`). Build from that artboard with Soft Glass (`docs/design/soft-glass.md`).

5. Make your changes. Work against a development or throwaway database, never production (`docs/LOCAL_DEVELOPMENT.md`).

// turbo
6. Verify build works (against a development or throwaway database):
   ```bash
   npm run build
   ```

7. Check it in the browser. Open every page you changed, in light and dark, at 320–1280px, and with the keyboard. The type check and the build don't catch every runtime error.

8. Stage only the files for this change, check the list, then commit with a conventional message that names the ticket:
   ```bash
   git add path/to/changed-file.tsx path/to/other-file.ts
   git diff --cached --stat
   git commit -m "feat: description (AIIN-123)"
   ```
   Don't use `git add .` or `git add -A`: they sweep in unrelated work, local env files and scratch files.

9. Push feature branch:
   ```bash
   git push -u origin feature/feature-name
   ```

10. Update the ticket in Kaam: what changed and how you checked it. Move it to **In Review** if it still needs a manual or test-key check, or **Done** if it's verified. Add user-facing changes to `CHANGELOG.md`, and record significant decisions as an ADR in `docs/architecture/`.

## Commit Message Format
Name the ticket at the end of the subject, e.g. `fix: require interview ownership in grading (AIIN-116)`.
- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring

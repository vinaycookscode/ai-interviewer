# Badges are stored once earned; the 90-day certificate is a public, unguessable page
**Date:** 2026-10-30  
**Status:** Accepted · implemented (AIIN-102, AIIN-101)  
**Deciders:** Vinay

## Context

The plan page showed a badge grid computed on every load from current numbers, so a badge disappeared when its streak ended. Candidates also wanted proof of finishing the 90-day plan that they could share with employers and on LinkedIn.

## Decision

- **Badges are rules plus stored facts.** `lib/achievements/rules.ts` (pure, tested) defines 12 badges for real milestones: streaks, practice count and best score, challenges, problems solved, flashcards, and the 30/60/90-day checkpoints. Once earned, a badge is stored in `UserAchievement` (one row per user and badge) and stays earned.
- **The server awards, at the moment of the action.** Each action that can earn a badge calls `awardAchievements` for the metrics it changed. The client never claims a badge. A "New badge" toast shows on the next page, from `seenAt`.
- **Backfills are marked as seen.** `scripts/award-achievements.ts` gives existing candidates what they'd already earned without a pile of toasts. It was run once on production on 2026-11-01, at the owner's request: 3 "First eight" and 4 "First practice" badges.
- **The certificate is a public page with an unguessable code.** Finishing the plan issues one `Certificate` per enrolment at `/certificate/GBTU-XXXX-XXXX` (an alphabet without look-alike characters).
  - It shows only the name, plan, date and code.
  - It's `noindex`, and a wrong code is a plain 404.
  - It offers Add to LinkedIn and Copy link.

## Consequences

**Easier:** Badges are fast to show and never vanish. An employer can check a certificate without an account.

**Harder:** A badge rule changed later doesn't take back badges already earned; a new rule needs the backfill script run again. The certificate page is public by design, so it must never show more than the name, plan, date and code.

## Alternatives considered

- **Keep computing badges on every load:** no storage, but badges flicker away, and the queries grow with every badge.
- **Certificates behind sign-in, or as PDFs:** an employer couldn't check one, and a PDF can be edited.

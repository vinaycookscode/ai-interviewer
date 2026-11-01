# One streak for the whole app, counted in IST days
**Date:** 2026-10-30  
**Status:** Accepted · implemented (AIIN-99, AIIN-67)  
**Deciders:** Vinay

## Context

The 90-day plan had its own streak, computed from completed plan tasks in UTC. The daily challenge (AIIN-99) needed a streak too. Two streaks would disagree, and a UTC day ends at 5:30 IST, so a candidate practising after midnight IST could lose a day they had kept.

## Decision

- **One streak, stored as days.** `ActivityDay` holds one row per candidate per IST day on which they did something that counts. Today, plan tasks and the daily challenge count. Two things on one day still count as one day.
- **IST days everywhere.** Streaks, the week on Today, flashcard due dates and the weekly report all use IST days, from the pure helpers in `lib/daily-challenge/logic.ts`, which are unit-tested.
- **Today isn't over until midnight.** The streak ends today, or yesterday when nothing is done yet today. A missed day ends it.
- **A paused plan doesn't hold it.** Activity keeps the streak, not enrolment.
- **The daily question** is the same for everyone on a role track for the whole IST day, with no repeats until the pool is used.
- **When Gemini fails,** the challenge answer is saved ungraded and graded on the next visit. The day still counts.

## Consequences

**Easier:** Every screen shows the same number. New kinds of activity join the streak by writing an `ActivityDay`. Badges (AIIN-102) read the same days.

**Harder:** Every new feature that should keep the streak must remember to record its day. The app assumes IST; candidates in other time zones see days end at IST midnight.

## Alternatives considered

- **Compute the streak from each feature's own tables:** a slow query that grows with every feature, and easy to get out of step.
- **The user's own time zone:** fairer abroad, but nearly every candidate is in India, and we don't store a time zone yet. Worth revisiting if that changes.

# Feature 10 — Study Squad
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Peer study groups for collaborative interview prep

---

## What This Feature Does

Candidates can create or join study squads — small peer groups for collaborative interview preparation. Members share progress, encourage each other, and may participate in group challenges.

---

## High-Level Assessment

Based on the schema and files found, the Study Squad feature has a `StudySquad` model and related actions, but the implementation is minimal. The client page exists but the feature appears to be in early development rather than a fully shipped capability.

---

## Finding 1 — Feature Has No Real Collaborative Functionality (P1 Product)

A study squad currently appears to be a list of users with no interaction model beyond membership. There is no:
- Shared progress view ("your squad members completed X practice sessions this week")
- Group challenges or competitions
- In-squad messaging or discussion
- Squad leaderboard

Without interaction, a "study squad" is just a contact list. The feature does not deliver on its implied value proposition.

**Decision:** Before shipping this as a PRO feature, define the minimum viable squad interaction. The simplest useful version: weekly digest email showing each member's activity (interviews completed, mock sessions, streak). This requires no real-time infrastructure — a cron job compiling `UsageRecord` data per squad is sufficient.

---

## Finding 2 — No Invite / Join Flow Visible in the Code (P2)

The squad model likely has a `members` relation, but there is no visible invitation flow. How does a candidate invite a friend to their squad? How does someone join an existing squad? Without a join mechanism, squads can only be created by an admin seeding data.

**Decision:** Implement invite by email link (same pattern as candidate interview invite). Squad creator gets a shareable join link. Recipient clicks link → logs in → joins squad. This can reuse the existing `token`-based invite pattern.

---

## Finding 3 — Squad Membership Has No Privacy Model (P2)

Squads can be public (anyone can join) or private (invite only), but this distinction may not be enforced. A public squad exposes all member names and progress to anyone who searches for squads.

**Decision:** Add `isPublic Boolean @default(false)` to `StudySquad` if not already present. Private squads require an invite link. Public squads are discoverable but members must explicitly join.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | No real collaborative functionality | P1 product | High | Define MVP interaction model; start with weekly activity digest email |
| 2 | No visible invite / join flow | P2 | Medium | Email invite link with token, same pattern as candidate interview |
| 3 | No privacy model enforced | P2 security | Low | isPublic flag; invite-only for private squads |

---

## Recommendation

The Study Squad feature should not be presented to users until Finding 1 is resolved. A feature that is labeled "Study Squad" but provides no collaborative value will create confusion and erode trust. It should either be hidden behind a feature flag until the interaction model is built, or removed from the navigation until it is ready.

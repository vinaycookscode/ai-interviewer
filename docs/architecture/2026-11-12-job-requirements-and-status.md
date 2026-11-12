# Job requirements, confirmed by the employer, and a job status for Talent Match
**Date:** 2026-11-12  
**Status:** Accepted · implemented (AIIN-192)  
**Deciders:** Vinay

## Context

Talent Match (epic AIIN-190) matches candidates to jobs. A free-text description can't be matched reliably, and an AI's reading of it shouldn't be trusted without the employer's say. Jobs also had no notion of being open or not: every job could be used for AI interviews as soon as it existed.

## Decision

- **Structured requirements on `Job`:** must-have and nice-to-have skills, a years range, location, work mode (`ONSITE`, `HYBRID`, `REMOTE`, rather than the ticket's "remote" flag, because the approved design shows hybrid), a pay range in rupees a year, and a maximum notice period. `requirementsConfirmedAt` records when the employer confirmed them.
- **Gemini proposes, the employer confirms.** After a job is created, its requirements page asks Gemini for a proposal. The proposal is shown and never saved until the employer confirms. The description is quoted to the model as data, with a note to ignore instructions inside it, and the reply is checked field by field like any other input (`lib/job-requirements.ts`). One attempt per request and at most 20 proposals per employer an hour, so a rate limit never loops. If Gemini fails, the form starts empty and works by hand.
- **One name per skill.** A plain synonym list (`lib/skills.ts`) folds "JS" into "JavaScript", and the server de-duplicates. A skill can't be both a must-have and a nice-to-have.
- **`status`: DRAFT, OPEN, PAUSED, CLOSED.** New jobs start as DRAFT; confirming requirements opens them, and OPEN needs at least one confirmed must-have. Jobs that existed before were migrated as OPEN (CLOSED if archived) with empty requirements, and show "Add requirements to get matches".
- **The status gates Talent Match only** (matching, job search, applications). It doesn't change AI interviews: an employer can still invite candidates to a draft job's interview, as today. Folding the two together would break the existing flow for no gain.

## Consequences

- Matching (AIIN-199) and job search (AIIN-202) list only OPEN jobs with confirmed requirements.
- Old jobs keep working, but aren't matched until their employer adds requirements.
- The synonym list needs growing as real skills come in; it's one plain module.

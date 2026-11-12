# Match scoring: deterministic, computed on change, refreshed daily
**Date:** 2026-11-12  
**Status:** Accepted · implemented (AIIN-199)  
**Deciders:** Vinay

## Context

Talent Match needs a match % between a job and a candidate that employers can trust: the same every time, explained, and never built on who the candidate is. The ticket asked for a Postgres queue read by a Vercel cron each minute.

## Decision

- **The score is pure arithmetic** (`lib/match-score.ts`): must-have skills 45%, relevance of past work 25%, experience fit 20%, nice-to-have skills 10%, rounded to the nearest 5. Relevance is the cosine similarity of the job's and the candidate's embeddings, mapped from 0.5 (none) to 0.9 (full). Same inputs, same score; AI never changes a number. `scorerVersion` records which rules made it.
- **Hard filters first:** the job's place, unless it's remote, and experience within its range ±1 year. Candidates come only from `discoverableWhere` (AIIN-198), then the top 200 by similarity.
- **Reasons:** three from Gemini for the top 20 of each job, each resting on a confirmed fact (skills, job titles, years), never the resume text. Without them, plain reasons from the facts. A missing must-have is always named last.
- **No query reads a name, gender, age or college.** Candidates come in as skills, job titles, years and city, read straight from those fields.
- **Matched on change, not by a per-minute cron.** Per-minute cron needs a paid Vercel plan, and this project's crons are daily. So confirming a job's requirements, or a profile's facts, or switching findable on, queues the work and runs it once the response is sent: a new job's matches exist within seconds. Switching findable off, or blocking an employer, deletes the rows at once. A `MatchTask` table holds anything that fails, and a daily cron (`/api/cron/matches`) retries it and refreshes jobs whose matches are older than 7 days.
- **The match card's parts follow this scorer**, not the approved design's sub-scores (practice score, and location and pay): location is a filter, pay isn't scored, and practice score is on the anonymous card.

## Consequences

- Changing the weights or filters needs a new `scorerVersion` and a refresh of every job.
- If matching ever needs to run more often than daily without a change, move to a paid plan's per-minute cron and keep the same queue.

# Keep resume reviews for a year, with the text they used
**Date:** 2026-11-14  
**Status:** Accepted · implemented (AIIN-64)  
**Deciders:** Vinay

## Context

A resume review was shown once and lost. Candidates couldn't see whether their changes helped, and every look meant a new review (and a use of their monthly allowance). The resume screener audit (2026-10-24) asked for a history.

## Decision

- **Every review is saved** as a `ResumeReview`: its score, what it was for (the job description's first line, or none for a general review), the review itself, and the resume text and job description it used. The cover letter and rewrite tabs need that text, and comparing before and after means seeing what was reviewed, not today's resume.
- **Shown only to the candidate.** The page lists the latest 20 and opens the newest. A review is fetched again only by its owner (`getResumeReview`). Employers never see them.
- **Kept for a year.** The daily retention job deletes reviews older than 365 days, the same period as interview integrity events. Deleting the account deletes them at once (cascade). The privacy policy lists it.

## Consequences

- Resume text is now stored in two places: the profile's current text (`CandidateProfile.resumeText`, replaced with the resume) and each review's own copy. The copies are what makes "compare" possible, and they expire.
- Rows are a few kilobytes of text plus the review; at a handful per candidate per month this is small.

## Alternatives considered

- **Keep only the review, not the text.** It's less personal data, but the cover letter and rewrite tabs couldn't run on an old review, and the comparison would lose what was actually reviewed.
- **Keep reviews forever.** It's simpler, but holds personal data longer than its use; a year covers a placement season.
- **Keep only the latest review.** It's the least data, but it answers "what did U say last time" and not "did it get better".

# Resume facts: proposed by AI, confirmed by the candidate, never personal
**Date:** 2026-11-12  
**Status:** Accepted · implemented (AIIN-193)  
**Deciders:** Vinay

## Context

Talent Match needs facts about candidates (skills and years, jobs, education, city) that employers can rely on. Resumes hold them, but also hold names, emails and phone numbers, and an AI's reading of a resume can be wrong.

## Decision

- **Two sets on `CandidateProfile`:** `resumeFacts` (confirmed by the candidate: the only facts ever shown to employers or matched on) and `proposedFacts` (waiting for them). Reading a new resume only replaces what waits, so confirmed facts stay until the candidate confirms new ones. City and total years are copied from the confirmed facts into their own columns for matching; notice period is the candidate's own answer.
- **Read on the facts page, not in the background.** The page reads the resume when the current one hasn't been read, with a visible "U is reading your resume". A new upload clears the old reading. No job queue, and the candidate sees it happen.
- **No personal details in facts.** The prompt asks Gemini to leave out name, email, phone, address and links, and `checkFacts` drops any value that looks like an email, an Indian mobile number or a link anyway. The resume is quoted as data, with a note to ignore instructions inside it.
- **The resume text stays on the server.** It's stored for later use (matching, AIIN-199) but never sent to the browser, not even to its owner's page: the page only learns whether it could be read.
- **A scan is told apart from a failure.** A PDF with fewer than 80 characters of text is recorded as read and unreadable ("may be a scanned image; add your facts by hand"). A file that can't be fetched, or a Gemini failure, is "try again" and leaves the resume unread.

## Consequences

- Matching uses only `resumeFacts`, the profile's `city`, `totalYears` and `noticePeriodDays`.
- `phone` exists on the profile for applications (AIIN-195) but is never part of facts.
- No OCR: scanned resumes need facts typed in. Revisit if many candidates hit it.

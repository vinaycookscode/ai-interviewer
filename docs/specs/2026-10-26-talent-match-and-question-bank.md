# Talent Match and Question Bank
**Date:** 2026-10-26  
**Status:** Planned, not started  
**Epics:** AIIN-190 Talent Match · AIIN-206 Question Bank  
**Working doc:** https://claude.ai/artifact/3RCEh75EwYE336y4hfBsBk  
**Decisions:** [ADR 2026-10-26: consent and a computed match score](../architecture/2026-10-26-talent-match-consent-and-computed-score.md)

Two epics, one loop: a job finds its candidates, and every interview a candidate takes makes the next one easier to prepare for.

- **Talent Match (AIIN-190).** An employer posts a job and sees opted-in candidates ranked by a match % with reasons. They invite the best to apply, call them, run interview rounds and record an outcome. Candidates can also search open jobs and apply directly. Every application for a job is in one place.
- **Question Bank (AIIN-206).** Each candidate has a personal bank of interview questions, filled from mock practice, AI interviews, Company prep saves, real interviews and the jobs they applied to. Before an interview it becomes a prep set for that job.

## Where the product is today

| Area | What exists | What is missing |
|---|---|---|
| Jobs | `Job`: title, free-text description, required documents | Skills, experience range, location, salary, status |
| Getting candidates in | The employer invites a known email to an AI interview | Discovery, invitations to apply, applications |
| Employer's candidate list | `/dashboard/candidates` lists interviews, search by name or email | Pipeline stages, per-job view, call notes |
| Candidate profile | `CandidateProfile`: role, experience level, skills, target companies | Opt-in, city, notice period, phone |
| Resume | PDF in R2 (`User.resumeUrl`); text read only by the resume screener | Stored text, confirmed facts, embedding |
| Interviews | `InterviewStatus`: one AI interview per invite | Rounds, human interviews, outcome |
| Questions | `CompanyQuestion`, `Question` (per job), `MockAnswer` (text only) | One place for a candidate's questions |
| Spaced repetition | `FlashcardProgress` (Leitner boxes) | Reuse for the bank |

## Talent Match

### The hiring flow

```
Job posted → Matched → Invited to apply → Applied → Screening call → Interview round ⟲ → Selected
 (employer)  (system)    (employer)      (candidate)   (employer)     (AI or human)    ↘ Rejected
                              ↘ Declined     ↑ or applies directly          Screening ↘ Rejected
```

| Stage | Who moves it | What the other side sees |
|---|---|---|
| Matched | System | Nothing; candidates aren't told about every match |
| Invited | Employer, with a short message | Candidate: job, company, match reasons, Accept or Decline |
| Applied | Candidate, adding a phone number and a note | Employer: name, contact details, resume |
| Screening | Employer, after calling | Candidate: "In review" |
| Interviewing | Employer schedules an AI round (today's flow) or a human round (date, time, link) | Candidate: date, kind of round, and a prep set from the Question Bank |
| Selected / Rejected | Employer | Candidate: the outcome in words, optional reason |

Candidates can withdraw at any stage. A direct application starts at Applied with `source` = DIRECT. `/dashboard/candidates` becomes the cross-job view of applications.

### The match %

Gemini extracts facts; code computes the score; Gemini explains it. The same job and resume always give the same %.

1. **Facts, once per save.** The job's must-have and nice-to-have skills, experience range, location and salary are proposed by AI and confirmed by the employer. The resume's text is extracted (`pdf-parse`); skills with years, total years, last role and city are proposed by AI and confirmed by the candidate.
2. **Find candidates.** SQL hard filters (opted in, location or remote, experience within the range ±1 year), then the top 200 by pgvector similarity.
3. **Score in code.**

   | Part | Weight | Measure |
   |---|---|---|
   | Must-have skills | 45% | Share matched, synonyms mapped |
   | Experience fit | 20% | Full inside the range, −25 points per year outside |
   | Relevance of past work | 25% | Job vs resume experience similarity, 0–100 |
   | Nice-to-have skills | 10% | Share matched |

   Rounded to the nearest 5.
4. **Explain the top 20.** Three reasons each, tied to a resume line; missing must-haves always shown.

**Refresh:** when a job is confirmed or edited, when a profile is confirmed or opted in, and nightly for matches older than 7 days. Work runs from a Postgres queue table read by a Vercel cron each minute. New matches of 80%+ go into a daily employer digest.

**Later, with consent:** a "verified skills" part from AI interview scores the candidate chooses to share.

### Consent, privacy and fairness

- **Opt-in:** "Let employers find me", off by default, with a preview of the card employers see. Turning it off removes the candidate from match lists within minutes, but not from jobs already applied to. Searching and applying need no opt-in.
- **Anonymous until applied:** before Applied, employers see role, experience, confirmed skills, city, match % and an ID like "Candidate 4F2A"; never name, contact details, resume file or practice history.
- **DPDP Act:** consent for the purpose, a way to withdraw, deletion on request. Legal review before launch (AIIN-205).
- **Fairness:** name, gender, age, photo, college name and address are stripped before embedding or scoring and can't be filtered on. No personality or culture-fit score in matching. The match ranks but never hides: the full filtered list is always available. Each match records its `scorerVersion`.
- **Abuse limits:** a daily invitation limit per job set by plan; candidates can block an employer.

### Data model

| Table | Key fields |
|---|---|
| `Job` (new columns) | `status`, `mustHaveSkills[]`, `niceToHaveSkills[]`, `minYears`, `maxYears`, `location`, `remote`, `salaryMin`, `salaryMax`, `embedding vector(768)` |
| `CandidateProfile` (new columns) | `discoverable`, `discoverableSince`, `city`, `noticePeriodDays`, `totalYears`, `phone`, `resumeText`, `resumeFacts`, `factsConfirmedAt`, `embedding vector(768)` |
| `JobMatch` | `jobId`, `candidateProfileId`, `employerId`, `score`, `parts`, `reasons[]`, `scorerVersion`, `computedAt` |
| `Application` | `jobId`, `candidateId`, `employerId`, `source`, `stage`, `stageChangedAt`, `coverNote`, `rejectionReason` |
| `ApplicationEvent` | `applicationId`, `actorId`, `fromStage`, `toStage`, `note`, `createdAt` |
| `Interview` (new columns) | `applicationId`, `roundName`, `kind`, `outcome` |

Embeddings: Gemini `gemini-embedding-001` at 768 dimensions, pgvector on Neon, HNSW indexes. Every `JobMatch` and `Application` query filters by the session's `employerId` in the query itself; match cards `select` from `CandidateProfile` and never join `User`.

## Question Bank

### Sources

| Source | Added when | Comes with |
|---|---|---|
| Mock practice | Each answer is scored | Answer, score, feedback, model answer |
| AI interviews | The interview is complete | Topic and feedback; question text only if the employer allows it |
| Company prep | The candidate taps Save | Reference answer, tips, frequency |
| Real interviews | The candidate adds it | Notes; model answer on request |
| Recommended | An application reaches Interviewing | Why it was picked |

### Use

1. Browse and search by company, topic, type and status; search by meaning.
2. Practise a question by voice or text, scored against the reference answer.
3. Track confidence: New, Practising, Confident, with Leitner review dates.
4. Prep set for a scheduled interview: 15 questions, 6 from the job's must-have skills, 4 from the company's bank, 5 from the candidate's weak spots. SQL filters, similarity ranking, near-duplicates dropped (similarity over 0.92), gaps filled by Gemini and marked "AI-suggested".

Employer questions are their test: by default only the topic and feedback are kept. Candidate-added questions can flow into Company prep after moderation, without the candidate's name.

### Data model

| Table | Key fields |
|---|---|
| `BankItem` | `userId`, `source`, `questionText`, `topic`, `type`, `companyName`, `tags[]`, `status`, `box`, `nextReview`, `notes`, `embedding vector(768)`, links `companyQuestionId?`, `mockAnswerId?`, `answerId?`, `applicationId?` |
| `BankAttempt` | `bankItemId`, `transcript`, `score`, `feedback`, `createdAt` |
| `MockAnswer` (fix) | `companyQuestionId?` |

The bank links to its sources; it never copies them. Every query is scoped to the session user.

## Plan

| Slice | Epic | Tickets | Ships when |
|---|---|---|---|
| 1. Structured jobs and resumes | Talent Match | AIIN-191 design, 192, 193, 194 | Jobs carry confirmed requirements; profiles carry confirmed facts |
| 2. Applications and pipeline | Talent Match | AIIN-195, 196, 197 | Everything after Applied works for email-invited candidates |
| 3. Talent Match | Talent Match | AIIN-198, 199, 200, 201, 202, 203 | Employers see explained matches; candidates search and apply |
| 4. Question Bank core | Question Bank | AIIN-207 design, 208, 209, 210, 211, 212 | Candidates see every question they faced or saved |
| 5. Prep sets and flywheel | Question Bank | AIIN-213, 214, 215 | A scheduled interview comes with 15 picked questions |

Slices 1, 2 and 4 are independent; 3 needs 1 and 2; 5 needs 2 and 4. AIIN-208 follows AIIN-47.

**Overlap to settle:** AIIN-155 Shortlist records a hiring decision per interview (AIIN-157). Once `Application` exists, the outcome belongs on the application; agree the mapping before building AIIN-157 or AIIN-195.

## Open decisions (AIIN-204)

- [x] Candidates can search open jobs and apply without an invitation (decided 2026-10-26).
- [ ] Talent Match in every employer plan, or paid per invitation? Recommended: a monthly invitation allowance per plan.
- [ ] Phone number required to apply?
- [ ] Human interviews scheduled in the product, or only recorded? Recommended: record plus a calendar invite.
- [ ] Who moderates candidate questions before Company prep?

## Risks

| Risk | Mitigation |
|---|---|
| Too few candidates opt in | Ask at the moment of value ("3 open jobs match your profile") |
| Resume extraction is wrong | Candidates confirm facts before use |
| The % feels arbitrary | Show the four parts and reasons; review weights after 50 hires |
| Employer questions leak | Topics only by default |
| Invitation spam | Daily limits, blocking, one-tap decline |

## Success measures (3 months after launch, to be reset after the first month)

| Metric | Target |
|---|---|
| Active candidates opted in | 30% |
| Jobs with 5+ matches of 70%+ | 60% |
| Invitations accepted | 25% |
| Invited applicants reaching an interview | 40% |
| Candidates with an interview who open their prep set | 70% |

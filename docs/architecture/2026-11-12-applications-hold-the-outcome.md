# Applications hold a candidate's outcome for a job
**Date:** 2026-11-12  
**Status:** Accepted · implemented (AIIN-195)  
**Deciders:** Vinay

## Context

AIIN-157 gave each AI interview a decision (Undecided, Shortlisted, On hold, Rejected), which compare, bulk decisions, share links and export all use. Talent Match (AIIN-195) adds an application per job and candidate, with stages from applied to hired. Two records could each claim to be the outcome, and the ticket asked to settle which before building. It also asked for `/dashboard/candidates` to become a cross-job list of applications, which conflicted with the ranked-by-job page approved and released the same day (AIIN-217).

## Decision

Decided by Vinay on 2026-11-12:

- **The application holds the outcome.** Its stage is what a candidate's status for a job is. An AI interview's decision moves the application, never the other way round:
  - Shortlisted moves an Applied application to Screening;
  - Rejected moves it to Rejected, with the decision note as the reason;
  - On hold sets the application on hold;
  - closed applications aren't moved.
  - The shortlist features keep reading the interview decision, as before.
- **Stages use the approved design's names:** Applied, Screening, Interview, Offer, Hired, Not moving forward (`REJECTED`). `INVITED`, `WITHDRAWN` and `DECLINED` exist for Talent Match invitations and for candidates leaving, and are shown only where they apply. Employers can't set Withdrawn or Declined, or move an Invited one.
- **The Candidates page stays ranked by job.** Each job has an Applications view, linked from its page and from its group on the Candidates page. There's no cross-job applications list for now.
- **Every move and note is an `ApplicationEvent`** with who and when. Not moving forward needs a reason, which only the team sees; the candidate sees "Not selected".
- **Invitations to an AI interview create an application at Applied.** A migration created one for every existing job and candidate with an interview, with the stage taken from the latest decision.
- **An invitation not yet accepted is anonymous:** no name, email or interview is loaded for it, and a name search skips it.

## Consequences

- Two records still hold a decision, but only one way round: the interview's verdict feeds the application. Moving an application by hand doesn't change the interview's decision.
- My applications (AIIN-197) and invitations (AIIN-201) build on `Application`.
- Deleting a candidate's account deletes their applications (cascade). Their interviews stay, anonymised, as before.

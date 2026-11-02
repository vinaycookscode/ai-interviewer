# Deleting an account: at once, everything of the candidate's, employer records kept anonymised
**Date:** 2026-11-02  
**Status:** Accepted · implemented (AIIN-58)  
**Deciders:** Vinay

## Context

Candidates had no way to delete their account and data, which the Digital Personal Data Protection Act 2023 expects, and which the landing page's privacy note promised. Even an admin couldn't do it for them: `Interview` and `MockInterview` restrict deleting their user, so `db.user.delete` failed for anyone who had done an interview. Their uploaded files (resume, Aadhaar, PAN, offer letters) would have stayed in R2 even if it hadn't.

Interviews done for employers are also the employer's hiring records: their score, the integrity verdict, the employer's decision and review.

## Decision

- **Self-service, at once.** "Delete your account" sits on the profile (approved artboards "Delete your account"). The candidate types their email to confirm. Everything is deleted in one transaction, the session is ended, and they land on `/account-deleted`. There is no grace period.
- **Candidates only.** An employer's jobs and interviews belong to their company, so employers write to us.
- **Everything that is the candidate's own goes.** This includes:
  - practice interviews and answers, coach chats, the plan, badges and certificate, flashcards, offers
  - usage records, feedback, password-reset tokens and squad activity (tables that name the user without a foreign key)
  - every table that cascades from the user
- **Employer interviews are kept, anonymised.** They move to one placeholder user, "Deleted candidate" (`deleted-candidate@getbacktou.invalid`).
  - **Kept:** the score, integrity verdict, the employer's decision and its history, and their reviews.
  - **Deleted:** answers and transcripts, documents, the AI personality profile, the overall AI feedback, proctoring events, the consent record (it held the IP and user agent) and the invitation token.
  - The placeholder has a random, unstored password and its interviews have no token, so nobody can sign in as it or claim it by registering. It can't itself be deleted.
- **Files go after the data.** `deleteR2Prefix` removes `profiles/<userId>/` and `documents/<interviewId>/`. It refuses any prefix that isn't one folder deep. A storage failure is logged, never a half-deleted account.
- **One path.** The admin console's delete uses the same `deleteAccount` for candidates, which also fixes it failing.
- **Not covered here:** copies Razorpay keeps of payments, and Resend's logs of sent emails. Those are the providers' own records under their terms.

## Consequences

**Easier:** Deletion is complete and immediate, and the same everywhere. Employer lists and reports keep adding up.

**Harder:**
- A mistaken deletion can't be undone.
- Lists show "Deleted candidate" rows that can't be opened for answers.
- A new table that names a user without a foreign key must be added to `deleteAccount`.

## Alternatives considered

- **Delete employer interviews too:** employers would lose records of interviews they ran, and their counts would change after the fact.
- **A 7-day grace period:** safer against mistakes, but it needs a locked state, a daily job and a cancel flow, and leaves data in place longer than asked.
- **Soft delete (a `deletedAt` flag):** the data would still be there, which isn't deletion.

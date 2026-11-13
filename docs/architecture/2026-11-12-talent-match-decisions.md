# Talent Match: invitation allowance, phone on apply, human rounds
**Date:** 2026-11-12  
**Status:** Accepted (AIIN-204)  
**Deciders:** Vinay

## Context

Three open questions from the Talent Match spec had to be settled before invitations (AIIN-201) and interview rounds (AIIN-196): how employers pay for invitations, whether a phone is needed to apply, and what the product does for a human interview.

## Decision

- **Invitations come as a monthly allowance per plan.** Each plan gets `talentInvitesPerMonth`, editable by admins with the other plan limits. The allowance starts at Free 10, Pro 50, Premium 200, and the count resets each calendar month (IST). An employer without a subscription gets the Free allowance. The matches page shows how many are left ("4 of 10 left this month"), as in the approved design.
- **A phone is required to apply.** Hiring here leans on calls. Applying asks for a phone (10 to 15 digits, + allowed), prefilled from the profile and saved there. Invitations accepted from the inbox (AIIN-201) ask for it the same way.
- **Human rounds are recorded with a calendar invite, and there's no built-in video.** The employer enters the date and time, the interviewer and a meeting link (Meet, Zoom or any). The candidate gets an email with an `.ics` file and sees the round in My applications. Rescheduling or cancelling sends an update.

## Consequences

- Pricing can change by editing plan numbers, with no code change. Paid per-invitation credits can come later if needed.
- A required phone may lower applications a little. If it does, we revisit.
- Calendar files mean no calendar integration to maintain. Employers keep using their own meeting tools.

## Implementation of human rounds (AIIN-196)

- **Human rounds have their own table, `HumanRound`**, under the application: round name, start, length, interviewer, https meeting link, outcome (Passed, Not passed, Didn't join) and a cancelled time. They are not rows in `Interview`, so ranking, compare, decisions and export, which all read AI interviews, are unaffected.
- **AI rounds stay as they are.** Adding one from the application calls the existing invite (same email, link and expiry). An AI round's outcome shown in the list is its hiring decision: Shortlisted reads Passed, Rejected reads Not passed.
- **Booking any round from Applied or Screening moves the application to Interviewing**, with a line in its history.
- **The calendar invite** is an iCalendar file with a stable UID per round. Each new time or cancellation raises its SEQUENCE, so calendars replace or remove the earlier event. Round emails are always sent, even when application emails are off, because the candidate has to attend.
- **The candidate sees the next round's name, date, time and link** in My applications, never its outcome.

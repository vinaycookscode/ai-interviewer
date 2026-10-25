# Employer accounts are invite-only
**Date:** 2026-10-25  
**Status:** Accepted — implemented (AIIN-53)  
**Deciders:** Vinay, Engineering

## Context

Employer self-registration was switched off in the sign-up form (the role picker is commented out in `components/auth/register-form.tsx`). Anyone who signed up was quietly given a candidate account, so an employer who signed up landed in a candidate dashboard with no explanation.

## Decision

- Keep employer accounts invite-only. The team creates them.
- The sign-up page says so under the submit button: "Hiring? Employer accounts are invite-only. Contact us", with a mail link.
- The note is hidden on interview invitation links, where the visitor is a candidate.
- The landing page's employer band says the same ("Employer accounts are set up by our team") and its call to action is a mail link, not a sign-up link.

## Consequences

**Easier:** Every employer is known before they can invite candidates, which keeps interview links and candidate documents away from unknown accounts.

**Harder:** Each employer needs a manual setup step. A self-serve employer plan would need a new decision, plus verification of the company.

## Alternatives considered

- **Re-enable the role picker.** Anyone could become an employer and send interview invitations in the product's name.
- **Leave it silent.** Employers kept ending up in the wrong account type.

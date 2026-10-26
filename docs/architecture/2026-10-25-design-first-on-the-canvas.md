# Design every screen on the canvas before building it
**Date:** 2026-10-25  
**Status:** Accepted — implemented (AIIN-142 to AIIN-148, AIIN-186; AIIN-156 in review)  
**Deciders:** Vinay, Engineering

## Context

The first Soft Glass screens were built straight from a written brief. Built screens kept drifting from the look agreed in review: spacing, type sizes and colours were reinvented per screen, and review happened only after the code was written, when changes cost the most.

## Decision

**Design first, then build.**

1. **The design system.**
   - It lives in a Design System artifact called [Soft Glass](https://claude.ai/artifact/2JZbtdJ8oyWeAcKrRep3JQ), built from the code's exact values: tokens for both themes, type styles, spacing, radii, shadows and the core components with previews.
   - It is the source of truth for values. When a value changes, it changes there first, and then in `app/design-system.css` (AIIN-142).
2. **The design canvas.**
   - Every screen is drawn on the [design canvas](https://claude.ai/artifact/Q1hFq3HP7UtDQ34dRQ17uQ) against that design system, in batches.
   - Each batch has a Kaam design task, and each screen gets desktop light, desktop dark and 390px phone frames. Exceptions: admin is desktop only, and employer phones cover overview and candidates.
   - States the code really has (loading, empty, error, locked, limits) get their own frames.
3. **Review before code.** Vinay approves a batch, its design task moves to Done, and only then do its build stories start. The batches:

   | Batch | Screens | Ticket |
   |---|---|---|
   | 0 | Design system | AIIN-142 |
   | 1 | App shell, auth, system states | AIIN-143 |
   | 2 | Today, practice, interview, documents, feedback | AIIN-144 |
   | 3 | Resume, company prep, flashcards, 90-day plan | AIIN-145 |
   | 4 | Profile, offers, plans, subscription, analytics, mentors, study squads | AIIN-146 |
   | 5 | Employer dashboard | AIIN-147 |
   | 6 | Admin console pattern | AIIN-148 |
   | 7 | Emails | AIIN-186 |
   | 8 | Shortlist (new feature) | AIIN-156 |

4. **The designs only show what the code can do.** A screen is designed from the real data and states in the code. When the code does something wrong, the design doesn't copy it, and the design ticket says so. Examples:
   - fake test results in the problem solver (AIIN-149);
   - offers features advertised but never built;
   - server key status shown to employers.
5. **Checks on the canvas.**
   - Artboards are validated statically: markup closed, template holes defined. Each artboard's logic is run through every state in Node.
   - Colours come only from design-system tokens.
   - Status is told by icon and word, never by colour alone. There is one coral call to action per view.

## Consequences

**Easier:**
- Builders work from a spec, not a description. The approved artboards are HTML with inline values and states, so a build agent can translate them directly.
- Review is cheap, because it happens before code.
- Product questions surface early, for example whether free users can practise (AIIN-189).

**Harder:**
- Every new screen or feature needs a design task first, including features from the competitor review (AIIN-156, AIIN-164, AIIN-175).
- The canvas has to be kept in step when a design changes during the build.

## Alternatives considered

- **Build first, review in the browser.** This is what we had, and it produced the drift.
- **Static mockups in a design tool.** They don't show states or behaviour, and the values drift from the code. The canvas artboards use the same tokens as the code.

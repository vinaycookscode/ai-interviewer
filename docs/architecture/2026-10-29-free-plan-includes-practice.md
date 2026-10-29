# The Free plan includes 2 practice interviews a month
**Date:** 2026-10-29  
**Status:** Accepted  
**Deciders:** Vinay

## Context

The landing page and the in-app pricing sell Free as "2 mock interviews a month", and the FREE `SubscriptionPlan` has `mockInterviewLimit: 2`. But the practice page showed every free user an upgrade prompt, so nobody on Free could ever start a practice (AIIN-189). We were promising something we didn't deliver.

## Decision

- **Free users can practise, up to 2 times a calendar month.** The practice page no longer blocks free users; it shows the allowance ("2 of 2 practices left this month") like every other plan.
- **The server stays the gate.** `createMockInterview` checks the plan's limit with `checkUsageLimit("mock_interview")` before creating anything, as it already did. The page only displays the same numbers.
- **Out of practices:** the Start button is replaced by "See plans", with a line saying they come back on the 1st.
- **A plan with a limit of 0** (practice not included) still gets the upgrade prompt.

## Consequences

**Easier:** What we sell matches what the product does. Practice is the best taste of the product, and free users now get it.

**Harder:** Each free practice costs Gemini calls. Two a month per user is bounded, and the limit can be changed in the plan row without a deploy.

**Known gap:** the limit check and the usage increment aren't one atomic step, so two practices started at the same instant could both pass. That allows at most one extra practice, so it isn't worth a fix now.

## Alternatives considered

- **Keep practice paid and change the Free copy.** It's simpler, but free users would then have nothing that shows the product working.

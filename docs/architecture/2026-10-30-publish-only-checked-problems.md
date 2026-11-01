# A coding problem is published only when its reference solution passes every test
**Date:** 2026-10-30  
**Status:** Accepted · implemented (AIIN-107; AIIN-219 and AIIN-220 build on it)  
**Deciders:** Vinay

## Context

Problems were seeded straight into the database. Three seeded problems failed their own tests for every candidate (AIIN-219), and nothing stopped a broken problem from reaching candidates. Admins needed to add and edit problems, and candidates needed to see whether they had solved one (AIIN-220).

## Decision

- **Problems have a life cycle:** `DRAFT`, `PUBLISHED` or `ARCHIVED`. Candidates only ever see published problems, in company prep and the daily challenge. Archiving hides a problem but keeps candidates' saved solutions.
- **Publishing needs a passing check.** "Check solution" runs the reference solution against every test, visible and hidden, on the code runner ([ADR](2026-10-30-code-execution-hosting.md)), in any of the four languages.
  - A coding problem publishes only when the current solution and tests have passed. `CompanyQuestion.checkedHash` records the hash of exactly what passed.
  - A later edit to a published problem that would fail isn't saved.
- **Every change is recorded.** `ProblemChange` records who changed what and when, as one readable line.
- **Hidden tests stay on the server.** Candidates see hidden tests only as passed or failed, never their inputs ([ADR](2026-10-26-send-the-client-only-what-it-needs.md)).
- **"Solved" means every test passed** in at least one language; anything saved short of that is "Attempted" (AIIN-220). The server's own test run decides the counts, never the browser's.
- **The seed checker.** `scripts/check-problems.ts` (read-only) checks every stored problem against its tests; 191 of 191 passed after AIIN-219.

## Consequences

**Easier:** A broken problem can't reach candidates, and a fix can't quietly break a published one. Solved status can be trusted, so badges such as "25 problems" can use it.

**Harder:** Writing a coding problem needs a working reference solution and tests before it can go live. Changing a published problem means checking it again.

## Alternatives considered

- **Trust the author, and fix problems when candidates report them:** this is how AIIN-219 happened.
- **Count a problem as solved once something is saved:** this is what the list did before AIIN-220. It made the progress count meaningless.

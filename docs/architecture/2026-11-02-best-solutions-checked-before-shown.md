# Best solutions: written by AI, shown only if they pass every test, after the candidate has tried
**Date:** 2026-11-02  
**Status:** Accepted · implemented (AIIN-221)  
**Deciders:** Vinay

## Context

Candidates asked for two or three model solutions to each coding problem, with their time complexity. There are about 190 coding problems and one hand-written reference solution each, in one language. Writing 2–3 approaches in four languages by hand would leave most problems without any for a long time. Showing AI-written code without checking it risks teaching a wrong "best" answer.

## Decision

- **Written by Gemini, checked by the runner.** The prompt gives the problem and each language's starter, so the code fits the tests' calling convention. Every language of every approach then runs against all the problem's tests, hidden ones included, on our code runner ([ADR](2026-10-30-code-execution-hosting.md)).
  - Code is kept only for the languages that passed every test.
  - An approach is kept only if at least one language passed.
- **Stored once, reused by everyone.** `ProblemSolution` holds the approach, its time and space complexity, a short explanation, the passing code per language, and a hash of the tests. When an admin changes the tests, the hash no longer matches and the solutions are generated again on the next request.
- **Generated on first request.** The first eligible candidate to open the panel waits up to a minute; later visits read the stored copy (about 30 ms locally). These checking runs aren't logged against the candidate's rate limit. A second request for the same problem on the same server waits for the first.
- **Hidden until the candidate has tried.** The panel unlocks once they've submitted any attempt (`UserCompanySolution`). The action enforces the same access as running tests (company prep on, a paid plan, a published coding problem) plus that attempt.
- **The reference solution no longer reaches the browser.** The old "Show the solution" panel, and the `solutionCode` field the page sent with every problem, gave the answer away before any attempt. It's still used on the server, for the signature and the admin's check.

## Consequences

**Easier:** Every coding problem gets checked solutions in four languages with no authoring work. A wrong solution can't be shown, because one that fails a test is never stored.

**Harder:**
- Generation costs a Gemini call and up to 12 runner jobs per problem. The small runner handles two at a time, so the first open is slow.
- Solutions can be correct but not the clearest. Admins can't edit them yet, which would need a follow-up in the problem editor.
- Explanations and complexities come from the model. They're bounded in length, but not checked like the code is.

## Alternatives considered

- **Hand-written only:** the most reliable, but nearly every problem would have none.
- **Generate everything ahead of time:** no wait for the first candidate, but it spends Gemini and runner time on problems nobody opens. A backfill script can still be added.
- **Show solutions any time:** simpler, but candidates who look first learn less. The owner chose "after a submit".

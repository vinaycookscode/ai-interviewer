# Send the client only what it needs: never whole user rows
**Date:** 2026-10-26  
**Status:** Accepted — implemented (AIIN-187)  
**Deciders:** Vinay, Engineering

## Context

While reviewing the Soft Glass build, two leaks of the candidate's whole `User` row turned up. The row includes the bcrypt password hash.

- `getInterviewFeedback` (`actions/feedback.ts`) is a server action, so it is a public endpoint.
  - It loaded any interview by ID with no session check, using `include: { candidate: true }`.
  - It returned the result to the caller, and wrote a backfilled score for anyone.
- `app/interview/[id]/page.tsx` passed the whole interview object, candidate row included, to the client component `InterviewClientPage`. The client's prop type only declared `id`, `language` and `job.title`, but React serialises everything it is given, so the hash went into the HTML of the candidate's own interview page.

TypeScript doesn't catch either case: an object with extra fields satisfies a narrower prop type.

## Decision

This extends [Authorize every data access on the server](2026-10-24-authorize-every-data-access-on-the-server.md).

1. **Select, don't include, user rows.**
   - Queries whose results leave the server (an action's return value, or props passed to a client component) use `select` with the fields the screen shows.
   - Never use `include: { candidate | user | employer: true }` for those results.
   - `include` of a user row is acceptable only when the row stays inside the server function (for example, reading an employer's email to send a notification).
2. **Pass client components exactly their props.** Build the object at the call site (`interview={{ id, language, job: { title } }}`); never spread or pass a database row.
3. **The action is the gate.** An action that returns user data checks the session and scopes its query itself (candidate, owning employer or admin). Pages calling it don't add a second access query. They act on the action's result (for example `viewer: "candidate" | "employer"`).
4. **Hide role-specific data at the source.** Employer-only fields (the personality profile) are removed in the action for candidate viewers, not just hidden in the UI.

## Consequences

**Easier:** A leaked page or a direct action call can't expose credentials or another user's data. There is one place to check access per action.

**Harder:** Every query that feeds a client needs an explicit field list, and new fields must be added to it deliberately.

**How it was checked:** over HTTP on the throwaway database.
- The report loads for its candidate and the job's employer.
- A different candidate, a different employer and a signed-out request get 404 or a redirect.
- No response, including the live interview page, contains a bcrypt hash.

## Alternatives considered

- **Prisma `omit: { password: true }` globally.** It's a useful backstop worth adding later, but it still sends every other column (documents, roles, timestamps), and it hides the habit problem instead of fixing it.
- **Rely on narrow TypeScript prop types.** They don't strip fields at runtime, which is exactly how the second leak happened.

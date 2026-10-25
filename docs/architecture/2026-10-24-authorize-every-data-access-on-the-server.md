# Authorize every data access on the server
**Date:** 2026-10-24  
**Status:** Accepted — implemented (AIIN-20, AIIN-28, AIIN-108, AIIN-113, AIIN-116, AIIN-117)  
**Deciders:** Engineering

## Context

The 2026-10-24 audits found that several server actions and routes trusted IDs sent by the browser:

| Gap | Ticket |
|---|---|
| Interviews with no token accepted any `?token=` value | AIIN-20 |
| `completeMockInterview` let any signed-in user overwrite another user's mock score | AIIN-108 |
| `startInterview`, `submitAnswer`, `completeInterview` and `gradeAnswer` never checked the session | AIIN-116 |
| Resumes, Aadhaar and PAN files were linked straight from a public R2 bucket | AIIN-113 |
| Uploads had no size or type check; `analyzeResume` fetched a client-supplied URL (SSRF) | AIIN-28 |
| Anyone who knew an invited candidate's email could set their password and sign in as them | AIIN-117 |

Server Actions are public HTTP endpoints. Hiding a button in the UI does not protect them.

## Decision

Every server action and route that reads or changes user data loads that data **scoped to the session user** (or checks the user's role) before doing anything else.

- **Interviews:** actions load the interview by ID *and* the session user's candidate ID, reject activity after completion, and require each question to belong to the interview's job. Grading lives in `lib/grading.ts`; the authorized `gradeAnswer` action is its only public entry point.
- **Interview links:** an interview without a token is always rejected.
- **Files:** documents are served by `GET /api/files/[...key]`, which checks access from the object key (profile owner; the interview's candidate or the job's employer; admin) and streams from R2 with `no-store` and `nosniff`. Links go through `documentHref()` in `lib/document-url.ts`. Stored URLs are unchanged.
- **Uploads:** `validateUpload()` in `lib/upload-validation.ts` enforces a 5 MB limit, detects the type from the file's bytes, and names files randomly. The server only fetches resumes from our own bucket.
- **Invited accounts:** an invited candidate's account (no password yet) can only be claimed with that person's own invitation link (`/interview/<id>?token=…`) as the callback, and it keeps its existing role.

## Consequences

**Easier:** A leaked or guessed ID is no longer enough to read or change someone else's data. New actions have a clear pattern to copy.

**Harder:** Every new action needs its own ownership check; there is no central policy layer yet. The service layer in [`2026-10-24-api-and-service-layer.md`](2026-10-24-api-and-service-layer.md) is the natural place for it.

**Still open:** public access on the R2 bucket must be switched off after deploying (AIIN-113). Until then the old bucket URLs still work for anyone who has one.

## Alternatives considered

- **Signed, expiring R2 URLs instead of a proxy route.** These stop working when shared, but they can't check *who* opens them; the proxy checks on every request.
- **Middleware-only checks.** Middleware sees the URL, not which interview or file an action touches, so it can't check ownership.

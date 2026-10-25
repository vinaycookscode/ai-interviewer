# Keep the role in the JWT and recheck it every five minutes
**Date:** 2026-10-24  
**Status:** Accepted — implemented (AIIN-30)  
**Deciders:** Engineering

## Context

The NextAuth `jwt` callback loaded the full user row on every `auth()` call, which is every server render and server action. Most pages call `auth()` several times, so each request cost several database queries just to read the user's role.

## Decision

- Put the role in the token at sign-in.
- Re-read **only the role**, at most every 5 minutes (`ROLE_RECHECK_MS` in `auth.ts`), or when the session is updated.

## Consequences

**Easier:** Most requests read the role from the token with no database query.

**Harder:** A role change (for example making someone an admin, or removing it) can take up to 5 minutes to apply to a signed-in user, unless the session is updated.

## Alternatives considered

- **Never recheck.** Fastest, but a removed admin would keep access until the token expires.
- **Cache the user in Redis.** Fixes the cost but adds infrastructure for one field; still an option if more user data is needed per request (see the Upstash proposal in the master decision index).

# Track work in Kaam
**Date:** 2026-10-24  
**Status:** Accepted  
**Deciders:** Vinay

## Context

Work was tracked in `task.md`, a long checklist that mixed finished phases, bugs and a 2026 roadmap. It had no owners, statuses beyond done or not done, or links to commits. The 2026-10-24 audits produced over 100 findings that needed priorities and a clear "what's next".

## Decision

- Track all work in **Kaam**, project **AIIN**, connected to Claude Code through the Kaam MCP server. Epics hold stories, tasks and bugs; sprints hold what's being worked on now.
- Every commit names its ticket in the subject, for example `fix: … (AIIN-116)`.
- When work changes state, the ticket is updated with what was done and how it was checked. Work goes to **In Review** when it still needs a manual or test-key check, and to **Done** when verified.
- `task.md` is kept as history only and is no longer updated.

## Consequences

**Easier:** One place shows status and the reason behind each change; commits and tickets point at each other.

**Harder:** Kaam runs locally (`npm start` in the Kaam project, port 4000), so it has to be running to read or update tickets.

## Alternatives considered

- **Keep `task.md`.** Fine for a solo checklist; it can't show status, priority or history.
- **GitHub Issues.** Would work; Kaam was already set up with every task.

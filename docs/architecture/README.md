# Architecture Decision Records (ADRs)

This directory records significant technical decisions made on this project — what was decided, why, and what alternatives were considered.

## Format

Each ADR is a markdown file named `YYYY-MM-DD-short-title.md`.

```
docs/architecture/
  2026-10-24-switch-to-prisma-migrations.md
  2026-11-01-add-redis-rate-limiting.md
```

## Template

```markdown
# Title
**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Superseded  
**Deciders:** [names]

## Context
What is the problem or situation that prompted this decision?

## Decision
What was decided?

## Consequences
What becomes easier or harder as a result?

## Alternatives considered
What else was on the table and why was it not chosen?
```

## Why ADRs

When a new engineer joins, or when you revisit a decision six months later, the code shows *what* was built but not *why*. ADRs answer the why. Keep them short — the goal is a record, not a design doc.

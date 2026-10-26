# Talent Match: candidates opt in, stay anonymous until they apply, and the match % is computed
**Date:** 2026-10-26  
**Status:** Proposed — planned, not started (AIIN-190, AIIN-206)  
**Deciders:** Vinay, Engineering

## Context

Employers want to see the candidates who best match a job they post, with a match %, and invite them to apply (AIIN-190). Candidates came to the product to practise, not to be sold to employers. Their resumes and practice answers are personal data under India's DPDP Act. A match % that an AI model makes up changes between runs and can't be explained. The full plan is in `docs/specs/2026-10-26-talent-match-and-question-bank.md`.

## Decision

1. **Opt-in.** A candidate appears in employers' match lists only after turning on "Let employers find me", off by default. Turning it off removes them within minutes, but not from jobs they already applied to.
2. **Anonymous until applied.** Before a candidate applies, employers see role, experience, confirmed skills, city and the match %; never name, contact details, resume file or practice history. Applying, whether invited or direct, is consent to that one employer.
3. **Candidates can search jobs and apply directly**, without opting in.
4. **The match % is computed in code** from facts that AI extracts and the employer or candidate confirms: must-have skills 45%, experience fit 20%, relevance of past work (vector similarity) 25%, nice-to-have skills 10%, rounded to 5. AI only writes the reasons. Each match stores its `scorerVersion`.
5. **Fairness.** Name, gender, age, photo, college name and address are stripped before embedding or scoring and can't be filtered on. No personality or culture-fit score is used in matching.
6. **Retrieval stays in Postgres.** pgvector on Neon with Gemini `gemini-embedding-001` at 768 dimensions. No separate vector database or framework.
7. **Employer questions stay private.** The Question Bank keeps an AI interview's topic and feedback, not the question text, unless the employer allows it (AIIN-214).

## Consequences

**Easier:** Candidates can trust the product with their data; employers can trust the %, and can see why a candidate matched. A complaint about a match can be traced to the facts and scorer version behind it. The same embeddings serve mock grading and the Question Bank.

**Harder:** Match lists start small until candidates opt in. Employers must confirm requirements before a job gets matches, and candidates must confirm their facts. The weights are a starting guess and will need review after real hires.

## Alternatives considered

- **Show every candidate to employers by default.** More matches on day one, but it breaks the trust candidates gave a practice tool, and it fails the DPDP consent test.
- **Ask the AI for the match % directly.** Simple, but the number drifts between runs and can't be explained or audited.
- **A hosted vector database.** Unneeded at our scale; it adds a service, a second copy of personal data, and access rules to keep in sync.
- **Use practice scores in matching from the start.** A strong signal, but only with explicit per-skill consent, so it is deferred to a later "verified skills" option.

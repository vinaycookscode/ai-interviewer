# Feature 04 — Resume Screener
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** AI-powered resume analysis, ATS score, gap detection, cover letter generation

---

## What This Feature Does

A candidate uploads a resume (PDF), optionally pastes a job description, and the AI returns a score (0–100), summary, strengths, weaknesses, improvement suggestions, missing keywords, and ATS compatibility score. A cover letter generator is also available. Gated behind subscription usage limits.

---

## Flow Map (Current)

```
Candidate
  └─ /candidate/resume-screener (ResumeScreenerView)
       └─ Uses resume from profile OR uploads a new file
       └─ Optionally pastes a job description
       └─ analyzeResume() server action
            └─ Fetches resume PDF from R2 URL (or accepts file upload)
            └─ pdf-parse extracts text from PDF
            └─ resumeScreenerService.analyze(text, jd) → Gemini prompt
            └─ Returns ResumeAnalysis JSON
       └─ Displays analysis in ResumeAnalysisView

Cover letter
  └─ resumeScreenerService.generateCoverLetter(text, jd) → Gemini
```

This is the **only feature** in the codebase that uses the service layer correctly — `resumeScreenerService` is a proper class, and the action calls it rather than calling Gemini directly. It also uses the `handleError` utility. It is the reference implementation for how the rest of the codebase should be structured.

---

## Finding 1 — Resume Fetched from R2 on Every Analysis (P1 Performance)

**File:** `actions/resume-screener.ts`

When the candidate uses their profile resume (the common path), the action fetches the PDF from R2 over HTTP on every analysis request:

```ts
const response = await fetch(resumeUrlFromProfile);
const arrayBuffer = await response.arrayBuffer();
buffer = Buffer.from(arrayBuffer);
```

A PDF download on a serverless function adds ~500ms–2s of latency before Gemini is even called. For a 1MB resume, this is a significant overhead on every analysis.

**Decision:** Cache the extracted text. After the first extraction, store the `pdfText` in a new `User.resumeText String?` field. On subsequent analyses, skip the fetch and extraction if the profile resume URL hasn't changed. Invalidate the cache when the user uploads a new resume.

---

## Finding 2 — Analysis Results Are Never Persisted (P1 Product)

**File:** `actions/resume-screener.ts`, `components/candidate/resume-screener-view.tsx`

The analysis result lives only in React state (`setAnalysis`). When the user navigates away and comes back, the analysis is gone. There is no history of past analyses.

A candidate cannot compare their resume score before and after making changes. They have no audit trail.

**Decision:** Add a `ResumeAnalysis` model to the schema:

```prisma
model ResumeAnalysis {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  score       Int
  atsScore    Int
  summary     String
  strengths   Json
  weaknesses  Json
  suggestions Json
  keywords    Json
  jobDescription String?
  createdAt   DateTime @default(now())
}
```

Store each analysis. Show the 5 most recent analyses with dates and scores so the candidate can track improvement.

---

## Finding 3 — `Promise.withResolvers` Polyfill Is a Code Smell (P2)

**File:** `actions/resume-screener.ts`

```ts
if (typeof Promise.withResolvers === "undefined") {
    Promise.withResolvers = function () { ... }
}
```

This polyfill patches the global `Promise` object to work around a missing API in the Node.js version used by Vercel's serverless runtime. `Promise.withResolvers` was added in Node 22. If Vercel is running Node 18 or 20, `pdf-parse` fails without this polyfill.

This is fragile — patching globals in a server action is not a reliable long-term solution. The real fix is either:
- Pinning the Node.js version to 22+ in `vercel.json` (`"functions": { "app/**": { "runtime": "nodejs22.x" } }`)
- Or replacing `pdf-parse` with a library that doesn't require this polyfill (e.g., `pdfjs-dist` which has better maintained types and no polyfill requirement)

**Decision:** Set `"engines": { "node": ">=22" }` in `package.json` and specify `nodejs22.x` in Vercel config. Remove the polyfill. If Vercel's runtime doesn't support Node 22 yet, migrate to `pdfjs-dist`.

---

## Finding 4 — No File Size or Type Validation on Direct Upload Path (P2 Security)

**File:** `actions/resume-screener.ts`

When a candidate uploads a file directly (not via profile URL), the action accepts it without validating:
- File size (no max size check — a 50MB PDF could OOM the serverless function)
- File type (MIME type is not checked — any file is accepted and passed to `pdf-parse`)

If `pdf-parse` receives a non-PDF file, it will throw an error that surfaces as a generic failure. If it receives a very large file, it may hit memory or timeout limits silently.

**Decision:** Add validation before the buffer is created:
- Max file size: 5MB
- Accepted MIME types: `application/pdf`
- If validation fails, return `{ error: "Please upload a PDF under 5MB." }`

---

## Finding 5 — Cover Letter Requires a Service Call but Has No Usage Limit (P2)

**File:** `lib/services/ai/resume-screener.service.ts` → `generateCoverLetter`

Cover letter generation calls Gemini but the `analyzeResume` action (which gates usage) is not invoked. There appears to be a separate `generateCoverLetter` action, but the usage tracking for this feature path needs verification. If it's unchecked, free users can generate unlimited cover letters.

**Decision:** Verify that `generateCoverLetter` goes through `checkUsageLimit("cover_letter")` or a named limit. If not, add it. Cover letter generation should be a separate usage bucket from resume analysis.

---

## Finding 6 — Analysis View Has No Loading Skeleton (P2 UX)

**File:** `components/candidate/resume-screener-view.tsx`

While analysis is in progress (`isPending: true`), the right panel shows a spinner. There is no skeleton layout that hints at the structure of the result. After 3–8 seconds of AI processing, the full result panel appears suddenly.

The analysis panel structure (score card, strengths list, keywords, suggestions) is known ahead of time. A skeleton with the right proportions would reduce the perceived wait time.

**Decision:** Add a skeleton version of `ResumeAnalysisView` that renders while `isPending` is true. This is a CSS-only change — same layout, shimmer backgrounds instead of content.

---

## Finding 7 — Atmospheric Background Divs Are in a Feature Component (P2 Design)

**File:** `components/candidate/resume-screener-view.tsx`

```tsx
<div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-blue-500/6 rounded-full blur-[100px]" />
<div className="absolute bottom-0 -left-20 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[100px]" />
```

Decorative background blobs are inline in the feature component. These are layout concerns and differ from the blobs on other pages (which use emerald/cyan). The resume screener uses blue/indigo — another ad-hoc color decision outside the design token system.

**Decision:** Remove from the component. When the design token system is established (UX audit P1), background treatment becomes a layout-level concern, not a feature-level one.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | Resume re-fetched from R2 on every analysis | P1 | Low | Cache extracted text in User.resumeText; invalidate on new upload |
| 2 | Analysis results not persisted | P1 product | Medium | Add ResumeAnalysis model; show history with score progression |
| 3 | Promise.withResolvers global polyfill | P2 | Low | Pin Node 22 in Vercel config; remove polyfill |
| 4 | No file size or MIME type validation | P2 security | Low | Validate before buffering: max 5MB, PDF only |
| 5 | Cover letter generation may bypass usage limits | P2 | Low | Verify and add cover_letter usage bucket |
| 6 | No loading skeleton during analysis | P2 UX | Low | Skeleton layout matching result structure |
| 7 | Decorative background blobs hardcoded in component | P2 design | Low | Remove; handle at layout level after token system is in place |

---

## What This Feature Does Well

This is the one feature with a proper service layer. `ResumeScreenerService` is a class with named methods. The action calls the service and handles errors through `handleError`. This is the reference pattern the rest of the codebase should follow when the service layer ADR is implemented.

---

## What Good Looks Like (Target State)

1. **Analysis history** — candidate sees score trend over time ("resume went from 64 → 78 → 82")
2. **Instant re-analysis** — cached text, no PDF re-fetch on repeat analyses
3. **Structured skeleton** — analysis panel previews its own shape while loading
4. **Safe uploads** — file size and type validated before any processing
5. **Usage correctly tracked** — analysis and cover letter are separate quota buckets

---

## Dependencies

- Design token system: `docs/audits/2026-10-24-ux-design-audit.md`
- Schema migrations: `docs/architecture/2026-10-24-switch-to-prisma-migrations.md`

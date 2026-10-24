# Feature 06 — Company Prep
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Company-specific interview kits with curated questions, code editor, and AI analysis

---

## What This Feature Does

Candidates browse a curated set of company-specific interview kits (TCS, Infosys, Amazon, Google, etc.). Each kit contains questions with difficulty ratings, frequency scores, answer hints, and starter code. A code editor is embedded for coding problems. AI analysis of solutions is available. Gated behind PRO subscription.

---

## Flow Map (Current)

```
Candidate
  └─ /candidate/company-prep (CompanyPrepPage)
       └─ Lists CompanyPrepKit records from DB
       └─ Card per company with gradient, question count, difficulty breakdown
  └─ /candidate/company-prep/[slug] (company kit page)
       └─ Lists CompanyQuestion records for that kit
       └─ Click question → CompanyProblemSolver modal/drawer
            └─ Shows problem, hints, starter code
            └─ CodeEditor (Monaco-based shared component)
            └─ "Analyze with AI" → analyzeCode() [SIMULATED]
            └─ saveUserSolution() server action
            └─ getUserSolution() to restore previous work
```

---

## Finding 1 — AI Code Analysis Is Entirely Simulated (P0 Product)

**File:** `components/company-prep/company-problem-solver.tsx` → `analyzeCode`

```ts
function analyzeCode(code: string, difficulty: string): CodeAnalysis {
    const codeLength = code.length;
    const hasLoop = code.includes("for") || code.includes("while");
    const hasMap = code.includes("Map") || code.includes("{}") || code.includes("Object");

    // Simulated analysis based on code patterns
    const isOptimal = hasMap && hasLoop;
    const timeComplexity = isOptimal ? "O(n)" : hasLoop ? "O(n²)" : "O(1)";
    ...
}
```

The "AI Code Analysis" feature — advertised as a premium feature to PRO subscribers — is a hard-coded heuristic function using string matching. It is not AI. It is not Gemini. It does not evaluate the candidate's solution correctness, approach, or quality. It checks for the presence of the word `Map` and decides the time complexity is O(n) if found.

This function returns fabricated analysis results and presents them as AI feedback. This is misleading to users who have paid for the PRO tier to access this feature.

**Decision:** Replace with a real Gemini call. The prompt should include the problem description, the candidate's code, and the expected language. Gemini should return time/space complexity, correctness assessment, and specific feedback. Remove the `analyzeCode` function entirely.

---

## Finding 2 — Company Cards Have Hardcoded Color Maps (P2 Design)

**File:** `app/candidate/company-prep/page.tsx`

```ts
const COMPANY_GRADIENTS: Record<string, string> = {
    tcs: "from-blue-600 to-blue-400",
    infosys: "from-cyan-600 to-teal-400",
    ...
};
const COMPANY_GLOWS: Record<string, string> = {
    tcs: "hover:shadow-blue-500/20",
    ...
};
```

Company-specific colors are hardcoded in the page file as slug-keyed maps. When a new company kit is added to the DB, the page shows no color unless the slug is also added to these maps in code.

**Decision:** Add `brandColor String?` to the `CompanyPrepKit` model. The page uses the DB value with a fallback to a neutral gray. No code change needed when a new company is added via admin.

---

## Finding 3 — Question Frequency Score Has No Documented Scale (P2)

**File:** Schema — `CompanyQuestion.frequency Int`

Questions have a `frequency` integer field. The UI presumably shows this as "how often this question appears in real interviews." But the scale is undocumented — is 100 the max? Is it raw count? Is it a 1–10 rating?

If data is seeded inconsistently, frequency bars and sorting will be meaningless.

**Decision:** Document the scale in a schema comment: `/// Frequency score 1-100: how often this question is reported in real interviews`. Validate on admin insert that values stay within 1–100.

---

## Finding 4 — No Solution Execution / Test Running (P2 Product Gap)

The code editor allows writing code but there is no way to run it against test cases. `CompanyQuestion.testCases` exists as a `Json?` field, but the test runner is never called. The candidate writes code in a vacuum with no feedback loop.

This is the core value proposition of a coding interview prep tool — running code against test cases — and it is missing.

**Decision:** This is a significant engineering effort. Evaluate two paths:
1. **Client-side JS/Python execution** — use Pyodide (Python in WASM) or the browser's own `eval` for JS. No server needed. Only works for JS/Python.
2. **Server-side execution sandbox** — use Judge0 (open source, self-hostable) or a managed API like `api.judge0.com`. Works for all languages but costs money per execution.

For a v1, client-side JS execution covers the most common interview use case (JavaScript/TypeScript LeetCode-style problems). Document the decision in an ADR.

---

## Finding 5 — User Solutions Are Stored but Never Aggregated (P3)

User solutions are saved to `UserSolution` (or equivalent). But there is no progress view: "you have solved 12/47 Amazon questions" or "your weakest area: Dynamic Programming."

The company prep page shows total question count per kit but not the candidate's completion percentage.

**Decision:** Add a completion percentage to each company card. `savedSolutions` count for the user divided by total questions in the kit = progress. Show as a progress bar on the card.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | AI code analysis is a fake string-matching heuristic | P0 product | Medium | Replace with real Gemini call |
| 2 | Company card colors hardcoded by slug | P2 design | Low | Add brandColor field to CompanyPrepKit model |
| 3 | Frequency score scale undocumented | P2 | Trivial | Add schema comment; validate 1-100 range |
| 4 | No code execution against test cases | P2 product gap | High | Evaluate client-side JS eval vs. Judge0 API |
| 5 | No per-company completion progress | P3 UX | Low | Show solved/total ratio on company cards |

---

## What Good Looks Like (Target State)

1. **Real AI analysis** — Gemini evaluates the candidate's code against the actual problem, not a string-matching heuristic
2. **Code runs** — JS test cases execute in the browser; Python via Pyodide; other languages via Judge0
3. **Progress tracking** — "You've solved 18/47 Amazon questions. Your weak area: Binary Search."
4. **Data-driven cards** — company brand color from DB, not hard-coded slug maps

---

## Dependencies

- Service layer: `docs/architecture/2026-10-24-api-and-service-layer.md`
- Design tokens: `docs/audits/2026-10-24-ux-design-audit.md`

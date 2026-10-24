# AI Cost Analysis & Reduction Plan
**Date:** 2026-10-24  
**Status:** Analysis complete — decisions pending  
**Verdict:** The product uses `gemini-1.5-pro` for every AI call with no caching, no batching, and no task-based model selection. Switching to the right model per task + adding caching will reduce AI costs by 85–90% with zero quality loss.

---

## Every AI Call in the Codebase

| # | Function | File | Called When | Approx Tokens (in/out) |
|---|----------|------|------------|----------------------|
| 1 | `generateInterviewQuestions` | `lib/gemini.ts` | Employer creates a job | 600 in / 200 out |
| 2 | `generateQuestions` | `actions/questions.ts` | Employer generates questions (same flow, second path) | 600 in / 200 out |
| 3 | `evaluateAnswer` | `lib/gemini.ts` | After every answer in a real interview | 600 in / 150 out |
| 4 | `generateFollowUp` | `lib/ai-context.ts` | After every answer in a real interview | 500 in / 50 out |
| 5 | `generatePersonalityProfile` | `lib/ai/personality.ts` | Once at interview completion | 4,000 in / 300 out |
| 6 | `generateMockQuestions` | `actions/mock-interview.ts` | On every mock session page load (not stored) | 300 in / 150 out |
| 7 | `saveMockAnswer` (eval) | `actions/mock-interview.ts` | After every answer in a mock interview | 500 in / 100 out |
| 8 | `completeMockInterview` (summary) | `actions/mock-interview.ts` | Once at mock completion | 200 in / 100 out |
| 9 | `resumeScreenerService.analyze` | `lib/services/ai/resume-screener.service.ts` | Each resume analysis request | 4,000 in / 400 out |
| 10 | `resumeScreenerService.generateCoverLetter` | `lib/services/ai/resume-screener.service.ts` | Each cover letter request | 3,500 in / 600 out |
| 11 | `generateGrowthInsights` | `lib/ai/analytics.ts` | On analytics dashboard load | 400 in / 130 out |
| 12 | `translateText` | `actions/translation.ts` | Interview question translation | Variable |
| 13 | `getAvailableGeminiModels` | `actions/gemini-config.ts` | Every model status check (HTTP, no tokens) | 0 (HTTP call) |

---

## The Core Problem: One Model for Everything

The default model is **`gemini-1.5-pro`** (hardcoded as fallback in `gemini-config.ts:12`). Every single call above uses it unless the user manually selects a different model in the header UI — which is an admin-level control visible to all users (another issue).

### Gemini Pricing Comparison

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Notes |
|-------|----------------------|------------------------|-------|
| **gemini-1.5-pro** | $1.25 | $5.00 | Current default |
| **gemini-1.5-flash** | $0.075 | $0.30 | 16× cheaper |
| **gemini-2.0-flash** | $0.10 | $0.40 | 12× cheaper; faster |
| **gemini-2.5-flash** | $0.15 | $0.60 | 8× cheaper; smarter than 1.5-flash |

The quality difference between Pro and Flash for structured JSON output tasks (scoring, question generation, short summaries) is minimal. Pro is designed for complex reasoning, long-context analysis, and nuanced writing — none of which is required for answer scoring or question generation.

---

## Cost Per Interaction (Current vs. Optimized)

### Real Interview (8 questions)

| Step | Calls | Tokens (in/out) | Cost on 1.5-Pro | Cost on 1.5-Flash |
|------|-------|-----------------|-----------------|-------------------|
| Question generation | 1 | 600 / 200 | $0.0018 | $0.0001 |
| Follow-up questions (8×) | 8 | 4,000 / 400 | $0.007 | $0.0004 |
| Answer scoring (8×) | 8 | 4,800 / 1,200 | $0.012 | $0.0007 |
| Personality profile | 1 | 4,000 / 300 | $0.0065 | $0.0004 |
| **Total per interview** | **18 calls** | **~13,400 / ~2,100** | **~$0.027** | **~$0.0016** |

**That is a 17× cost reduction per interview just by switching scoring and follow-ups to Flash.**

### Mock Interview (5 questions)

| Step | Calls | Tokens (in/out) | Cost on 1.5-Pro | Cost on 1.5-Flash |
|------|-------|-----------------|-----------------|-------------------|
| Question generation | 1 per page load | 300 / 150 | $0.0011 | $0.00007 |
| Answer scoring (5×) | 5 | 2,500 / 500 | $0.0056 | $0.00034 |
| Completion summary | 1 | 200 / 100 | $0.0008 | $0.00005 |
| **Total per session** | **7 calls** | **~3,000 / ~750** | **~$0.0075** | **~$0.00045** |

### Resume Analysis

| Step | Calls | Tokens (in/out) | Cost on 1.5-Pro | Cost on 1.5-Flash |
|------|-------|-----------------|-----------------|-------------------|
| Analyze resume | 1 | 4,000 / 400 | $0.007 | $0.0004 |
| Cover letter | 1 | 3,500 / 600 | $0.0074 | $0.00044 |

---

## Monthly Cost at Scale

**Scenario: 500 real interviews + 1,000 mock sessions + 300 resume analyses per month**

| Component | Current (1.5-Pro) | Optimized (Flash) | Savings |
|-----------|-------------------|-------------------|---------|
| Real interviews | $13.50 | $0.80 | $12.70 |
| Mock interviews | $7.50 | $0.45 | $7.05 |
| Resume analyses | $3.50 | $0.21 | $3.29 |
| Cover letters | $2.22 | $0.13 | $2.09 |
| Growth insights (1,000 loads) | $0.65 | $0.04 | $0.61 |
| **Total** | **~$27/month** | **~$1.65/month** | **~$25/month** |

At 5,000 real interviews/month, the current bill is ~$270/month. Optimized: ~$16.50/month.

---

## Specific Problems Multiplying Cost Right Now

### Problem 1 — Mock Interview Questions Regenerated on Every Page Load

**File:** `actions/mock-interview.ts` → `generateMockQuestions`  
**File:** `app/candidate/practice/[id]/page.tsx`

Questions are not stored in the DB. Every page load calls Gemini to generate 5 questions fresh. If a candidate refreshes the page 3 times before starting, that is 3 Gemini calls. This was documented as Bug F02 in the feature audit.

**Impact:** Every page load = 1 Gemini call. A candidate who spends 10 minutes on the session setup page while distracted has triggered 10+ unnecessary calls.

**Fix:** Store questions at `createMockInterview` time. Zero calls on subsequent page loads.

---

### Problem 2 — Follow-up Questions Fire After Every Answer

**File:** `lib/ai-context.ts` → `generateFollowUp`

After every answer, a Gemini call checks whether a follow-up question is warranted. The output is either a follow-up question or the string `"NO_FOLLOWUP"`. For short answers, informational answers, or answers to behavioral questions, the result will almost always be `"NO_FOLLOWUP"`.

This is 8 Gemini calls per interview that return empty output the majority of the time.

**Fix options (pick one):**
1. Only call follow-up generation if the transcript is shorter than 100 words (vague/incomplete answers that need probing)
2. Only call for technical questions (type-based gate)
3. Remove the feature entirely — it adds complexity and cost without proportional value

---

### Problem 3 — Growth Insights Recalculate on Every Dashboard Load

**File:** `lib/ai/analytics.ts` → `generateGrowthInsights`

The analytics dashboard calls Gemini to generate a coach summary on every visit. A candidate who opens the dashboard 5 times in a day triggers 5 identical Gemini calls with the same input data (score history hasn't changed).

**Fix:** Cache the result. Store `insightSummary String?` and `insightGeneratedAt DateTime?` on `CandidateProfile`. Regenerate only when new interview/mock data arrives (i.e., when `lastActiveAt` is more recent than `insightGeneratedAt`). Cost goes from N calls/day to 1 call per new interview completed.

---

### Problem 4 — Two Parallel Question Generation Paths

**Files:** `lib/gemini.ts` → `generateInterviewQuestions` AND `actions/questions.ts` → `generateQuestions`

Both functions generate interview questions. They have nearly identical prompts but slightly different parameters. Both are active in the codebase. Both use Pro. This duplicates maintenance and means fixes/optimizations must be applied in two places.

**Fix:** Consolidate into one function. Use the service layer (ADR already written) so there is a single `InterviewService.generateQuestions()` called by both paths.

---

### Problem 5 — Personality Profile Sends Full Untruncated Transcript

**File:** `lib/ai/personality.ts`

The personality profile prompt sends the complete transcript of all 8 answers — full, verbatim. A verbose candidate can generate 5,000+ input tokens just for this one call. The personality assessment needs themes and patterns, not every word verbatim.

**Fix:** Truncate each answer to first 400 characters before building the transcript for personality analysis. Personality signals are clear in the first few sentences of any answer. Cost of this call drops by ~60%.

---

## Optimization Plan (Ranked by Impact)

### Tier 1 — Do Immediately (No quality tradeoff)

**1. Route all tasks to Flash by default**

Change the default model from `gemini-1.5-pro` to `gemini-2.0-flash` or `gemini-1.5-flash`. Apply this in `gemini-config.ts`:

```ts
// Before:
return cookieStore.get('gemini_model')?.value || 'gemini-1.5-pro';

// After:
return cookieStore.get('gemini_model')?.value || 'gemini-2.0-flash-exp';
// or 'gemini-1.5-flash' for stable
```

This single line change reduces costs by 12–17× immediately with no code changes anywhere else.

**Estimated savings: 80% of current spend**

---

**2. Fix mock interview question storage (Bug F02)**

Store questions in `MockInterview.questions Json` at creation time. Read from DB on page load. Eliminates all question-regeneration calls.

**Estimated savings: ~15% of mock interview cost**

---

**3. Cache growth insights**

Add `insightSummary String?` and `insightUpdatedAt DateTime?` to `CandidateProfile`. Only regenerate when new data arrives.

**Estimated savings: Eliminates ~N×400 tokens per day per active user**

---

### Tier 2 — Task-Based Model Routing (After Tier 1)

Once Flash is the default, add model selection per task type. Only a few tasks genuinely need Pro-level intelligence:

| Task | Recommended Model | Reason |
|------|------------------|--------|
| Answer scoring | Flash | Structured JSON, well-defined rubric |
| Question generation | Flash | List output, no nuanced reasoning |
| Follow-up questions | Flash | Short conversational output |
| Mock question generation | Flash | Same as above |
| Mock answer scoring | Flash | Same as answer scoring |
| Growth insights | Flash | Short summary, data-driven |
| Translation | Flash | Well-understood task |
| **Resume analysis with JD** | **Flash or Pro** | JD comparison benefits from Pro on complex JDs |
| **Personality profile** | **Flash** | Structured JSON from transcript — Flash handles this |
| **Cover letter** | **Pro (optional)** | Quality writing; candidates may notice the difference |

In practice: Flash handles all tasks correctly. Use Pro only as an opt-in "premium quality" mode for cover letters if you want to differentiate the offering.

---

### Tier 3 — Batching (After Tier 2)

Instead of 8 separate `evaluateAnswer` calls per interview, send all 8 Q&A pairs in one prompt at completion:

```
Evaluate these 8 interview answers for a [role] position.
Return a JSON array of 8 objects, each with: score, feedback, criteria.

Q1: ...
A1: ...

Q2: ...
A2: ...
```

**Benefits:**
- 8 network round-trips → 1
- Gemini can evaluate answers relative to each other (more consistent scoring)
- Shared context means the system prompt tokens are paid once, not 8 times

**Estimated savings:** ~30% of scoring cost (eliminating 7× prompt overhead)

**Tradeoff:** Grading is delayed until interview end instead of per-answer. This requires the async grading approach already recommended in Feature 01 (Finding 4).

---

### Tier 4 — Gemini Context Caching (Advanced)

Gemini 1.5 supports **context caching** — you upload a prompt prefix once and pay only 25% of the normal input token price for subsequent calls that use that cached context.

For `evaluateAnswer`, the system prompt (~200 tokens) is identical for all 8 answers in an interview. Cache it:

1. At interview start: upload system prompt → receive a `cacheId`
2. For each answer: call with `cacheId` + question/answer payload
3. Pay full price for first call, 25% of input price for the 7 subsequent calls

**Eligible for caching:** `evaluateAnswer`, `generateInterviewQuestions`, `resumeScreenerService.analyze` (the system instructions portion)

**Estimated savings:** ~15% of input token cost for multi-call flows

---

## Summary Table

| Optimization | Effort | Cost Reduction | Quality Impact |
|-------------|--------|----------------|----------------|
| Switch default to gemini-2.0-flash | Trivial (1 line) | **~80%** | None |
| Store mock interview questions | Low (F02 fix) | ~3% | Fixes a bug |
| Cache growth insights | Low | ~1% | None |
| Gate follow-up on answer length | Low | ~5% | Minimal |
| Truncate transcript for personality profile | Low | ~2% | None |
| Batch answer scoring at completion | Medium | ~5% | Slightly better consistency |
| Context caching for system prompts | Medium | ~3% | None |
| **Combined** | | **~90% reduction** | **None** |

---

## Recommended Action

**Step 1 (today):** Change the default model to `gemini-2.0-flash` in `gemini-config.ts`. One line change. 80% cost reduction. No quality loss for any structured JSON task.

**Step 2 (this week):** Fix Bug F02 (store mock questions). Cache growth insights. Gate follow-up questions behind a word-count threshold.

**Step 3 (next sprint):** Batch answer scoring. Truncate personality profile input.

**Step 4 (later):** Evaluate Gemini context caching if costs are still significant at scale.

After Step 1 alone, the cost at 500 interviews/month drops from ~$27/month to under $2/month.

---

## One Additional Note on the Model Selector in the Header

`components/dashboard/header.tsx` exposes the Gemini model selector to all users. This means any user can switch the model to `gemini-1.5-pro` and run all their sessions on Pro. The model choice is stored in a cookie — per user, per browser — so it doesn't affect other users, but it does affect cost for that user's session.

**Decision:** Remove the model selector from the user-facing header. Move it to an admin-only settings page. The model used for scoring should be a platform decision, not a user-configurable option.

# Gemini: one server key, a safe default model, bounded retries
**Date:** 2026-10-24  
**Status:** Accepted — implemented (AIIN-27, AIIN-37, AIIN-109, AIIN-111)  
**Deciders:** Engineering

## Context

- `gemini-1.5-pro` started returning `404`, so every Gemini feature failed for users without a saved model (AIIN-109).
- When a model was rate-limited, question generation and grading switched models and retried themselves with no limit. When the switch couldn't be saved (no cookies), they recursed forever (AIIN-37).
- Users could once bring their own Gemini key, stored in plaintext. The UI was removed in 2025, but the server action that saved keys was still callable (AIIN-27).

## Decision

1. **One key.** All Gemini calls use the server's `GEMINI_API_KEY`. The bring-your-own-key action is deleted, and the unused `User.geminiApiKey` column is dropped by a migration (production had 0 stored keys).
2. **A default that exists.** `DEFAULT_GEMINI_MODEL` in `lib/gemini-models.ts` is `gemini-2.5-flash`. When a chosen model returns `404`, the call retries once on the default and clears the stale model cookie.
3. **Bounded retries.** Rate-limit retries stop after `MAX_RATE_LIMIT_RETRIES` (3) and return a clear "busy" result.

## Consequences

**Easier:** A retired model or a busy quota degrades to a message instead of a crash or a hung request. There are no user secrets to protect.

**Harder:** All AI usage is billed to one key; per-user cost control has to come from plan limits (see `docs/audits/2026-10-24-ai-cost-analysis.md`).

**Related:** the header's model selector is still visible; removing it is part of the app-shell redesign (AIIN-86, folded into AIIN-125).

## Alternatives considered

- **Encrypt user keys instead of removing them.** No one was using them, and the UI was already gone.
- **Pin a dated model version.** It avoids silent behaviour changes but retires just like `gemini-1.5-pro` did; a fallback is needed either way.

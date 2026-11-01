# Ask U: a narrow context, stored chats, and a daily limit checked before Gemini
**Date:** 2026-10-30  
**Status:** Accepted · implemented (AIIN-100)  
**Deciders:** Vinay

## Context

Ask U is a chat with the AI career coach. A chat model sees whatever we send it, costs money per message, and can be asked anything. We had to decide what U knows about a candidate, what it will talk about, where chats live, and how use is limited.

## Decision

- **U knows only what it needs.** `lib/coach/context.ts` (pure, tested) builds the context from the candidate's career path, their last three practice and interview scores, their plan day and their streak. It never includes contact details, documents, employer details or anything about other users.
- **U stays on careers and interviews.** The system prompt refuses other topics, and refuses to help while an interview is in progress.
- **Chats are stored and deletable.** They live in `CoachConversation` and `CoachMessage`. The last 20 messages go to Gemini as context. Deleting a chat deletes its messages.
- **The limit is per plan, per IST day, checked on the server before Gemini is called.** It's `SubscriptionPlan.coachMessagesPerDay`: 10 on Free and 100 on paid plans, counted in `UsageRecord`. A message U failed to answer can be retried without counting again.
- **Replies stream.** `/api/coach` sends lines of JSON, rendered as Markdown. Screen readers hear each reply once it's finished.

## Consequences

**Easier:** Cost is bounded per user per day. What U can see is one small function to review. Plans can change the limit without code.

**Harder:** U can't answer questions that need data outside its context, such as a specific resume line, until the context is widened, which is a deliberate privacy decision each time. Stored chats are personal data the privacy policy covers.

## Alternatives considered

- **Send the whole profile and documents:** better answers sometimes, but far more personal data sent to the model on every message, and far more tokens.
- **Don't store chats:** less data held, but no history to return to, and no way to resume after a refresh.
- **Limit in the browser:** trivial to bypass. Limits live on the server, like plans and payments ([ADR](2026-10-24-server-decides-plans-and-payments.md)).

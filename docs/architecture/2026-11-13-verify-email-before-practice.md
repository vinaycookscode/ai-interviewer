# Verify email before practice, and count existing accounts as verified
**Date:** 2026-11-13  
**Status:** Accepted · implemented (AIIN-55)  
**Deciders:** Vinay

## Context

Anyone could sign up with any address and start using AI features straight away. We couldn't reach people at a real address, and AI usage (practice interviews cost Gemini calls) was open to throwaway accounts. The auth audit (2026-10-24, finding 9) asked for email verification with the most expensive features gated behind it. Over 1,000 accounts existed with `User.emailVerified` empty, because nothing had ever set it.

## Decision

- **A link by email, its hash stored.** On sign-up we send a link to `/auth/verify?token=…`: 32 random bytes, base64url. The `VerificationToken` row holds the SHA-256 of the token (identifier `verify:<email>`), never the token. A new link deletes the old one, so only the newest works, for 24 hours. Opening it sets `User.emailVerified`. Rules: `lib/email-verification.ts`.
- **Sign-up still signs you in.** The person lands on "Check your email" (with Send it again, 3 an hour) and can carry on into the app. Being blocked at sign-up before seeing anything would cost more sign-ups than it saves.
- **Practice waits for it.** Starting a practice interview (`createMockInterview`) refuses until the email is verified, and Today shows a banner. Employer interviews aren't gated: their invitation link already went to that address.
- **An invitation proves the address.** Claiming an invited account through its invitation link sets `emailVerified`.
- **Existing accounts count as verified.** Migration `verify_existing_emails` sets `emailVerified` for every account that existed before this change. Asking more than 1,000 active people to verify, with practice blocked until they do, would break the app for them to fix a problem that mattered for new sign-ups.
- **Messages say what happened.** Sign-in and sign-up return an error code (`lib/auth-errors.ts`) that the forms turn into a specific message (AIIN-57). "No account with that email" does tell someone whether an address is registered; sign-up already did ("that email already has an account"), so nothing new is exposed. Password reset still hides it.

## Consequences

- `emailVerified` is now meaningful only for accounts created from 2026-11-13. For older ones it means "existed before verification", not "proved the address".
- There's no way to change an account's email yet, so the board's "Wrong address? Change it" wasn't built. Someone who mistyped their address signs up again.
- Verification emails are sent directly through Resend, not the outbox: one email, sent in the request, with "Send it again" if it fails.

## Alternatives considered

- **Block the whole app until verified.** It's simpler and stricter, but it loses people at the moment they're most interested, and most of the app (resume review, flashcards, the plan) doesn't cost us per use.
- **Ask existing accounts to verify too.** It's more honest about what `emailVerified` means, but would lock out every current user from practice on release day.
- **A six-digit code instead of a link.** It's better on phones when the email opens in another app, but it adds a screen and a guessable secret; a link is one tap.

## Addendum 2026-11-14: changing the email (AIIN-227)

The "no way to change an account's email" consequence above no longer holds. Profile → Change asks for the new address and the account's password, then sends a link to the new address. It's a `VerificationToken` with identifier `change:<userId>:<new email>`: hash only, 24 hours, one per user. Until the link is opened the account keeps its email; opening it switches the address, marks it verified (the link proved it) and tells the old address. The password is checked before saying an address can't be used, so the dialog never reveals which addresses have accounts. Requests are limited to 3 an hour. The session's email refreshes with the role recheck, within 5 minutes.

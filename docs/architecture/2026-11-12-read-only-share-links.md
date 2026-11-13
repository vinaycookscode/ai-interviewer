# Read-only shortlist links for hiring managers
**Date:** 2026-11-12  
**Status:** Accepted · implemented (AIIN-161; extended by AIIN-173)  
**Deciders:** Vinay

## Context

An employer often needs a hiring manager to look at the shortlist, and that person has no account. They used to get screenshots or a forwarded login. AIIN-161 asks for a link the employer can hand over that shows only what a hiring manager needs, can be turned off, and expires.

## Decision

- **A random token in the URL, and only its hash stored.** `/share/<token>`: 32 random bytes, base64url (43 characters). The `ShortlistShare` row keeps the SHA-256 of the token, never the token, so a database leak or backup can't open a link. The employer sees the link once, when it's created ("Copy it now"). Losing it means making a new one. The rules are in `lib/share-link.ts`.
- **Live, not a snapshot.** The page reads the job's finished interviews that are Shortlisted (and On hold, if the link includes them) every time it opens. Shortlisting someone later adds them, and rejecting them removes them. A snapshot would show a list the employer has already changed their mind about.
- **What it shows is chosen field by field.** The query selects the candidate's name, score, summary, each answer with its question, score, feedback and transcript, and confidence, culture fit, strengths and weaknesses. Never emails, phone numbers, documents, integrity evidence, decision notes, interview ids or user ids. Candidates are numbered in the page rather than keyed by id.
- **Turned off beats expired, both checked on every open.** Each link has a label ("For Anita, engineering"), 1, 7 or 30 days, and can be turned off from the job page. A turned-off link says who turned it off, and an expired one says to ask for a new link. Only opens that show the list are counted (open count and last opened, shown next to the label).
- **Guessing is pointless and throttled.** A malformed token is a 404 before any lookup, and an unknown one is a 404 too. Each IP gets 30 tries a minute, right token or wrong, through the existing `RateLimit` table.
- **Kept out of search and caches.** `noindex` metadata, plus `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store` and `Referrer-Policy: no-referrer` on `/share/*` (in `next.config.ts`). The token never leaks through a Referer header.
- **Only the job's employer creates or turns off a link,** and not on an archived job. Another employer's job or link is not found.

## Consequences

- A link can be forwarded. That's the point of a link; the label, expiry, open count and Turn off are the controls. Per-person sign-in would need accounts for hiring managers, which is a larger feature.
- No email is sent: the employer copies the link into whatever they already use.
- Tokens can't be shown again. The active links list gives each link's label and expiry so it can be turned off, but not its URL.

## Alternatives considered

- **Signed URLs (JWT or HMAC) with no table.** They can't be turned off one at a time and can't count opens.
- **Storing the token itself.** It's simpler, and it lets the link be copied again later, but a leaked table would open every link.
- **A frozen snapshot of the shortlist.** It's predictable, but it goes stale the moment a decision changes, which is the opposite of what the ticket asks.

## Addendum 2026-11-13: placement officer links (AIIN-173)

The same model serves a college's placement officer: `/share/college/<token>`, a `CollegeShare` row per link holding only the token's hash, turned off or expired as above, and the same 30 tries a minute per IP (shared with shortlist links). It shows one college's students only: name, roll number, how far each got and, when the employer turns it on for that link, Shortlisted or nothing. Scores, answers, feedback, other decisions, documents and integrity details aren't selected. Links last two weeks past the drive's close by default, and at most 60 days past it.

Unlike shortlist links, these can be emailed, through the outbox. A queued row has to hold the link until it's sent, so the token sits in `OutboundEmail.payload` for that time. The outbox empties the payload once the email is sent or has finally failed, so afterwards only the hash remains.

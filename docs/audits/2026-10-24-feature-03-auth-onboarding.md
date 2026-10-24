# Feature 03 — Auth & Onboarding
**Date:** 2026-10-24  
**Status:** Analysis complete — implementation pending  
**Scope:** Registration, login, password reset, role routing, first-run onboarding

---

## What This Feature Does

Users register (email + password), log in with credentials, reset passwords via email token, and are routed to a role-appropriate dashboard. A `CareerWizard` component exists for candidate onboarding. NextAuth.js v5 with JWT sessions and a `PrismaAdapter`.

---

## Flow Map (Current)

```
New user
  └─ /auth/register → register() server action
       └─ Hashes password with bcrypt
       └─ Creates User with role=CANDIDATE (employer signup disabled)
       └─ If email already exists with null password (invited candidate):
            └─ Updates existing record → auto-login
       └─ signIn("credentials") → redirect to DEFAULT_LOGIN_REDIRECT

Returning user
  └─ /auth/login → login() server action
       └─ DB rate limit check (5 attempts / 15 min, IP-based)
       └─ signIn("credentials") → NextAuth Credentials provider
       └─ JWT callback: fetches user from DB on every JWT refresh → adds role to token

Password reset
  └─ /auth/forgot-password → requestPasswordReset()
       └─ Creates PasswordResetToken (email, token, expires)
       └─ Sends reset email via Resend
  └─ /auth/reset-password?token=... → resetPassword()
       └─ Validates token, checks expiry, hashes new password, deletes token

Session
  └─ JWT strategy
  └─ session callback: copies token.sub → session.user.id, token.role → session.user.role
  └─ jwt callback: fetches full user from DB on every token refresh

Onboarding
  └─ CareerWizard component — multi-step (role, skills, goals, resume upload)
  └─ Only shown on /candidate/profile page
  └─ User.onboardingComplete Boolean in schema — never checked at login time
```

---

## Finding 1 — JWT Callback Hits the Database on Every Request (P1 Performance)

**File:** `auth.ts`

```ts
async jwt({ token }) {
    if (!token.sub) return token;
    const existingUser = await db.user.findUnique({ where: { id: token.sub } });
    if (!existingUser) return token;
    token.role = existingUser.role;
    return token;
}
```

The `jwt` callback runs on every session access — every page load, every server action call, every API route hit. Each triggers a full `db.user.findUnique` query. On a page with 3 server components, that is 3 database queries per render just to populate `token.role`.

The role almost never changes after registration. This is unnecessary read traffic that scales linearly with active users.

**Decision:** Store role in the JWT at sign-in time and only re-fetch when explicitly needed (e.g., after an admin changes the user's role). The `jwt` callback should read from existing token fields first:

```ts
async jwt({ token, user }) {
    if (user) token.role = user.role;  // only on initial sign-in
    return token;
}
```

If role changes need to propagate without re-login, add a `roleVersion` integer to the user record and store it in the token. Only re-fetch when `token.roleVersion !== db.user.roleVersion`.

---

## Finding 2 — Rate Limiting Uses the Database (P1 Performance)

**File:** `lib/rate-limit.ts`, `actions/auth.ts`

Login rate limiting is implemented with a `RateLimit` table in PostgreSQL. Every login attempt (successful or failed) writes to and reads from the DB. Under a brute-force attack, each attempt generates 2 DB operations (read + write), putting load on the database at exactly the moment it should be protected.

This is the opposite of how rate limiting should work. Rate limiting should be fast, cheap, and operate before reaching the database.

**Decision:** Move login rate limiting to Upstash Redis (or Vercel KV, which is backed by Upstash). The `@upstash/ratelimit` package provides a sliding window limiter in 5 lines. The DB `RateLimit` table can be dropped.

---

## Finding 3 — No Social / OAuth Login (P1 UX)

**File:** `auth.ts`

Only email + password credentials are supported. No Google, GitHub, or LinkedIn OAuth.

For an interview prep platform targeting Indian tech candidates, Google Sign-In is expected. A significant number of users will abandon registration when they see a password form instead of a "Continue with Google" button.

The `PrismaAdapter` is already installed and configured — adding Google OAuth is a 2-field addition to `auth.config.ts` and a `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` environment variable. The Prisma adapter handles the `Account` and `Session` tables automatically.

**Decision:** Add Google OAuth as the primary sign-in method. Keep email/password as secondary. The `Account` and `Session` tables are already in the schema (`@auth/prisma-adapter` generates them).

---

## Finding 4 — Onboarding Is Never Triggered After Registration (P1 UX)

**File:** `prisma/schema.prisma` (`User.onboardingComplete`), `components/candidate/career-wizard.tsx`, `app/candidate/profile/page.tsx`

`User.onboardingComplete Boolean @default(false)` exists in the schema. The `CareerWizard` component exists. But:

1. After registration, the user is redirected to `DEFAULT_LOGIN_REDIRECT` — not to an onboarding flow
2. `CareerWizard` is only shown on `/candidate/profile` — which the user has to navigate to manually
3. `onboardingComplete` is never checked anywhere in the routing or middleware

A new candidate lands on the dashboard with empty states and no guidance. The career wizard was built but never wired up.

**Decision:** After registration (or after first login for invited candidates), check `onboardingComplete`. If false, redirect to `/candidate/onboarding`. The wizard sets `onboardingComplete = true` on completion. Middleware should enforce: unauthenticated → login, authenticated + onboarding incomplete → onboarding, authenticated + complete → dashboard.

---

## Finding 5 — Employer Registration Is Silently Disabled (P2)

**File:** `actions/auth.ts`

```ts
// EMPLOYER SIGNUP DISABLED - Force all signups to be CANDIDATE
const role = "CANDIDATE";
```

The comment acknowledges this is intentional but there is no product-level explanation. The schema has `EMPLOYER` and `ADMIN` roles. Employers exist in the DB (invited via CSV bulk invite). But any employer trying to self-register is silently created as a `CANDIDATE`.

This creates a support surface: an employer registers, logs in, sees the candidate dashboard, and has no way to know what went wrong.

**Decision:** Either:
- Add a role selector at registration (Candidate / Employer) and re-enable employer self-registration with a separate onboarding flow
- Or keep employer accounts as invite-only and show a clear "Are you an employer? Contact us" message on the registration page with a link to a contact/waitlist form

The current silent downgrade is a product bug regardless of which direction is chosen.

---

## Finding 6 — Password Reset Token Has No Rate Limit (P2 Security)

**File:** `actions/auth.ts` → `requestPasswordReset`

The `requestPasswordReset` action sends a password reset email. There is no rate limit on this endpoint. An attacker can flood any email address with reset emails, or burn through Resend email quota, by calling this action repeatedly.

**Decision:** Add rate limiting to the reset request action — max 3 requests per email per hour. This can use the same Redis-based limiter proposed in Finding 2.

---

## Finding 7 — "Something went wrong" Is the Only Non-Credential Error (P2 UX)

**File:** `actions/auth.ts` → `login`

```ts
switch (error.type) {
    case "CredentialsSignin":
        return { error: "Invalid credentials!" };
    default:
        return { error: "Something went wrong!" };
}
```

Any auth error that isn't a credentials mismatch — network issue, DB timeout, NextAuth configuration error — returns the generic "Something went wrong." The user has no actionable information.

**Decision:** Map the most common `AuthError` types to user-facing messages. At minimum: `OAuthSignInError`, `OAuthCallbackError`, `SessionRequired`. For unknown errors, show "Sign in is temporarily unavailable. Please try again in a moment." instead of "Something went wrong."

---

## Finding 8 — Gemini API Key Stored Plaintext in User Table (P2 Security)

**File:** `prisma/schema.prisma`

```prisma
geminiApiKey  String?
```

The user record has a `geminiApiKey` field stored as a plain string. If the database is breached, all user Gemini API keys are exposed.

**Decision:** If this field is used for "bring your own key" functionality, encrypt it at rest using a server-side encryption key (AES-256, key stored in environment variable). Alternatively, store only the last 4 characters for display and re-prompt the user to enter the full key if re-verification is needed.

---

## Finding 9 — No Email Verification (P2 Security)

**File:** `actions/auth.ts` → `register`

After registration, the user is immediately logged in and redirected to the dashboard. There is no email verification step. Any email address can be used to create an account.

Consequences:
- Employer invite flow: a candidate is pre-created with a null password when invited. If an attacker knows an invited candidate's email, they can claim that account by registering with any password before the real candidate does.
- No way to contact users at verified addresses (marketing, security alerts)

**Decision:** Add email verification. After registration, send a verification email. Unverified users can view the dashboard but see a prominent banner: "Verify your email to unlock all features." Gate usage-tracked features (mock interviews, real interviews) behind email verification.

---

## Decision Summary

| # | Finding | Severity | Effort | Decision |
|---|---------|----------|--------|----------|
| 1 | JWT callback hits DB on every request | P1 | Low | Store role in token at sign-in; re-fetch only on role change |
| 2 | Rate limiting uses PostgreSQL | P1 | Low | Move to Upstash Redis / Vercel KV |
| 3 | No Google OAuth | P1 UX | Low | Add Google as primary OAuth provider |
| 4 | Onboarding wizard never triggered | P1 UX | Medium | Post-registration redirect to /candidate/onboarding; enforce in middleware |
| 5 | Employer signup silently creates a Candidate | P2 | Low | Add role selector or show explicit invite-only message |
| 6 | Password reset has no rate limit | P2 security | Low | Max 3 reset requests per email per hour (Redis) |
| 7 | Generic "Something went wrong" for all non-credential errors | P2 UX | Low | Map AuthError types to readable messages |
| 8 | Gemini API key stored plaintext | P2 security | Low | Encrypt at rest or redesign bring-your-own-key flow |
| 9 | No email verification | P2 security | Medium | Email verification step; gate usage-tracked features behind it |

---

## What Good Looks Like (Target State)

1. **One-click Google Sign-In** — primary auth method, credentials as fallback
2. **Onboarding enforced** — new users land on career wizard, not a blank dashboard
3. **DB-free session** — role in JWT, rate limiting in Redis
4. **Verified accounts** — email verification before AI features are unlocked
5. **Clear employer path** — employer self-registration or explicit waitlist, never a silent wrong-role creation

---

## Dependencies

- Rate limiting migration: Redis setup should be shared with the service layer ADR (`docs/architecture/2026-10-24-api-and-service-layer.md`)
- Middleware changes: coordinate with feature flag and subscription gating logic

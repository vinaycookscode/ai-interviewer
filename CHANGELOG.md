# Changelog

Notable changes, newest first. Tickets are in Kaam (project AIIN); the reasoning behind larger changes is in `docs/architecture/`.

## Unreleased

**Not committed yet.** Checked locally on a throwaway database unless marked otherwise.

### Design
- **Soft Glass**, the new design language: frosted glass over soft coral and lavender light, Fraunces and Plus Jakarta Sans, and U, the mascot. Light and dark are designed equally (AIIN-122; [ADR](docs/architecture/2026-10-25-soft-glass-design-language.md)).
- **Landing page rebuilt in Soft Glass:**
  - a product-preview hero (question, answer, score and a tip from U in one card)
  - how it works, features and the employer band
  - pricing with a monthly/yearly switch that carries the plan into sign-up
  - FAQ and contact
  - Checked from 320px to 1280px in both themes. On phones the header nav moves into a menu.
- **Sign-in, sign-up and password reset rebuilt in Soft Glass** (AIIN-124; built, not yet verified):
  - one glass card with clearer prompts ("New here? Create an account")
  - plan cards that actually show which plan is selected
  - no plan picker on sign-in or on interview invitations
  - a reset link's token no longer follows you to the sign-in page
- **One size scale** for type, spacing, radius and control heights, plus brand colour tokens and shared `PageHeader`, `Section`, `StatCard` and `StatusScreen` components (AIIN-118 to AIIN-120). These screens moved onto it:
  - career wizard (was unreadable in light mode; its skill "Add" button did nothing)
  - profile
  - interview entry page
  - flashcards
  - resume analysis
- Plan for the rest: epic AIIN-123, one story per area (AIIN-124 to AIIN-139).

### Docs
- New ADRs for every decision made on 2026-10-24 and 2026-10-25, with an index in `docs/architecture/README.md`.
- New `docs/LOCAL_DEVELOPMENT.md` (safe local testing) and `docs/design/soft-glass.md` (building a screen).
- README, environment setup, deployment guide, example env files and agent instructions brought up to date. The Gemini key is `GEMINI_API_KEY`; the Razorpay and `APP_URL` variables were missing.
- The audit decision index now shows the status of every finding.

## 2026-10-25

### Security
- Interview and grading actions check that the interview belongs to the signed-in candidate, and reject activity after completion (AIIN-116).
- An invited candidate's account can only be claimed through their own invitation link (AIIN-117).

### Interviews
- The final score waits for every answer to be graded (AIIN-36).
- Gemini rate-limit retries stop after three attempts with a clear "busy" message instead of retrying forever (AIIN-37).

### Sign-up
- Sign-up explains that employer accounts are invite-only, with a contact link (AIIN-53).

## 2026-10-24

### Infrastructure
- Deploys apply Prisma migrations instead of `prisma db push --accept-data-loss`; both databases are baselined (AIIN-15).
- `npm run dev` and the build's migrate step refuse to run against the production database (AIIN-114).
- The build fails with a clear message when `DATABASE_URL` is missing (AIIN-115).
- Dropped the unused `User.geminiApiKey` column (AIIN-111).

### Security
- Interviews without a token are no longer publicly accessible (AIIN-20).
- Mock interviews can only be completed by their owner (AIIN-108).
- Placement tasks can only be started or completed by their owner when unlocked (AIIN-23); day tokens are no longer exposed as server actions (AIIN-22).
- HTML emails escape interpolated values (AIIN-21).
- Seed and debug API routes require an admin (AIIN-26).
- Uploads are limited to 5 MB and validated by their actual content; closed an SSRF in resume analysis (AIIN-28).
- Candidate documents are served through an authorized route instead of public bucket links (AIIN-113).
- Removed the unused bring-your-own Gemini key flow, which stored keys in plaintext (AIIN-27).

### Payments
- Activating a subscription is bound to the paid Razorpay order: the plan, period and user must match, and a payment can't be reused (AIIN-25).
- The Razorpay webhook returns errors so Razorpay retries, and handles redelivered events once (AIIN-110). The `GET` handler is removed (AIIN-24).
- The plan choice passed from pricing to sign-up is a validated `?plan=&period=` parameter instead of fake encryption (AIIN-112).

### AI
- The default Gemini model is `gemini-2.5-flash`. A retired model falls back to it instead of failing every AI feature (AIIN-109).
- Company Prep code analysis uses Gemini instead of a fake string-matching heuristic (AIIN-18).
- Mock interview grading uses the candidate's actual role (AIIN-17).

### App
- The role is kept in the session token and rechecked every 5 minutes, instead of a database query per request (AIIN-30).
- Interviews explain that Chrome or Edge is required when the browser can't transcribe speech (AIIN-40).
- Fixed hooks order in the interview session (AIIN-16) and the system check's "Back to Dashboard" link (AIIN-45).

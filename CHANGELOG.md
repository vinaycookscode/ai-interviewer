# Changelog

Notable changes, newest first. Tickets are in Kaam (project AIIN); the reasoning behind larger changes is in `docs/architecture/`.

## Unreleased

On `develop`, not yet on `main`.

- The flashcard deck list loads your mastery for every deck in one query instead of one query per deck (AIIN-34).
- **Streaks and flashcards follow India time.** Placement-program streaks count IST calendar days, so finishing a task at 11:30 PM and another at 9 AM the next day continues the streak, and the first task now starts it. Flashcards come due at midnight IST (AIIN-67).
- **Today refreshes only when something can change.** It checks every 30 seconds only while an interview is in progress or waiting for its score, and no longer reloads itself right after opening (AIIN-81).
- Interview proctoring always logs to the current interview, and full-screen state is read straight from the browser (AIIN-43).
- **Practice says when it can't run.** If U can't check the AI service, the practice page says so and Start stays off, instead of looking available. When every model is rate-limited, practice still runs with offline questions and a banner (AIIN-48).
- **Deleting a job no longer fails or loses history.** A job no one was invited to is deleted. A job with candidates is archived instead: it leaves the employer's lists and stops taking invitations, and its interviews and reports are kept. Deleting used to fail with a database error for any job with interviews (AIIN-188; migration `job_archived_at`).
- **Password reset requests are limited.** One address gets at most 3 reset emails an hour, and one IP at most 5 requests every 15 minutes. Setting the new password is limited to 10 tries every 15 minutes per IP (AIIN-56).
- **Password reset uses the sign-up rule.** A new password needs at least 8 characters with an uppercase letter, a number and a symbol, whether it's set at sign-up or on reset. The reset server action checks it too, so a direct call can no longer set a weak or empty password. Both forms show the rule under the field before you type (AIIN-141).
- **Company prep shows only real test results.** Run Tests is offered for JavaScript and TypeScript, which run in the browser. Python, Java, C# and C++ used to show random pass/fail results; they now say tests aren't run for them and point to Analyze Code. Submitting saves test counts only for code that was actually run, and the server ignores counts for languages it can't run (AIIN-149).
- **Practice keeps its questions.** A practice's five questions are written once and stored, so a refresh or a return visit shows the same ones and picks up at the next unanswered question, with earlier scores kept. Answers are accepted only for the practice's own questions, once each. Question generation is no longer a public server action (AIIN-47; migration `mock_interview_questions`).
- **Free users can practise.** The Free plan's 2 practice interviews a month now work: the practice page no longer blocks free users. When the month's practices are used up, "See plans" replaces Start (AIIN-189; [ADR](docs/architecture/2026-10-29-free-plan-includes-practice.md)).

## 2026-10-29

In production. Each change was checked locally on a throwaway database before release.

- **Today loads only what it shows** (AIIN-32):
  - Finished interviews are listed 10 at a time, with a "Show 10 more" button. Upcoming interviews are all still listed.
  - The average score and the change since the first interview are worked out by the database across every scored interview, instead of loading every interview.
- **U is the brand mark everywhere.** It's now the favicon, the browser and Apple icons, the installed-app icons and the link-preview image. The admin header and the logo in the site's structured data use it too. The old logo files are gone. Generate the PNG and ICO versions from `public/brand/*.svg` with `node scripts/generate-brand-assets.mjs`.
- The web app manifest link works again: it pointed at a `/manifest.json` that didn't exist.
- **No preview environment for now.** `develop` isn't deployed. Changes are checked locally on a throwaway database and released by merging into `main` ([ADR](docs/architecture/2026-10-28-no-preview-environment.md)). Deployment and environment docs updated to match.
- Docs:
  - Environment docs and example env files name NextAuth's URL `AUTH_URL`, the name NextAuth v5 reads first. The older `NEXTAUTH_URL` still works.
  - The audit decision index and the size-scale ADR match current Kaam statuses.
  - The new-feature workflow stages only the change's files and names the ticket (AIIN-140).

## 2026-10-26

On `develop`. The build was checked on a throwaway database, then by Vinay locally against production data with payments, email and uploads switched off.

### Design
- **Soft Glass**, the new design language: frosted glass over soft coral and lavender light, Fraunces and Plus Jakarta Sans, and U, the mascot. Light and dark are designed equally (AIIN-122; [ADR](docs/architecture/2026-10-25-soft-glass-design-language.md)).
- **Every screen designed first.** Each screen was drawn and approved on the design canvas against the Soft Glass design system before it was built, in batches 0 to 8 (AIIN-142 to AIIN-148, AIIN-156, AIIN-186; [ADR](docs/architecture/2026-10-25-design-first-on-the-canvas.md)).
- **Landing page rebuilt:**
  - a product-preview hero
  - how it works, features and the employer band
  - pricing with a monthly/yearly switch that carries the plan into sign-up
  - FAQ and contact
- **Sign-in, sign-up and password reset rebuilt** (AIIN-124):
  - one glass card
  - plan cards that show which plan is selected
  - no plan picker on sign-in or on interview invitations
- **New app shell** instead of the sidebar (AIIN-125; [ADR](docs/architecture/2026-10-25-app-shell-navigation.md)):
  - Desktop: a floating header with Today, Interviews, Practice, Resume and the 90-day plan, a More menu, Go Pro on the free plan, a theme switch and an account menu.
  - Below 1024px: a bottom tab bar.
  - Employers: Overview, Jobs, Candidates, Settings and New job.
- **Today**, the candidate home: the next interview, plan and streak, average score, quick practice, and every interview with its actions (AIIN-126).
- **Practice:**
  - setup with role quick picks, level and the monthly allowance
  - the session as a focus page, with U's feedback after each answer
  - the result with strongest and weakest answers (AIIN-127)
- **Interview session:**
  - focus header with progress, a proctoring chip and the language picker
  - camera and mic check
  - document upload with clear size errors
  - every interview-link screen (expired, not open yet, wrong account…) in the new style (AIIN-128)
- **Feedback report** for candidates and employers; employers also see how the candidate came across (AIIN-129).
- **Employer dashboard** (AIIN-130):
  - overview with a score chart
  - a new jobs list
  - one job form with "Let U write the questions"
  - job detail with per-candidate Copy link, invite and a 4-step bulk invite
  - candidates with search and filters, sorted by score
  - settings
- **Upgrade prompt** for paid features restyled.
- Design-system fixes: a stronger focus ring (2px solid with a 2px gap), a darker form-field edge (at least 3:1), and a card-heading type style (AIIN-142).

### Security
- The feedback report action requires a login and only returns a report to its candidate, the job's employer or an admin. It no longer returns the candidate's password hash (AIIN-187; [ADR](docs/architecture/2026-10-26-send-the-client-only-what-it-needs.md)).
- The interview page no longer sends the candidate's account record (including the password hash) to the browser (AIIN-187).
- Job detail and job edit only load jobs owned by the signed-in employer. Candidate lists no longer send full user rows to the browser.
- Employer settings no longer show whether the server's Gemini and Resend keys are configured.

### Fixes
- Signing in from the documents page returns you to the right page.
- Bulk invite sends the valid rows and lists the ones it skipped, instead of refusing the whole file.
- The employer score chart no longer drops scores between bands (such as 2.5).
- The feedback button sits above the phone tab bar.

### Size scale
- **One size scale** for type, spacing, radius and control heights, plus brand colour tokens and shared `PageHeader`, `Section` and `StatCard` components, for screens not yet on Soft Glass (AIIN-118 to AIIN-120; [ADR](docs/architecture/2026-10-25-design-system-size-scale.md)). These screens moved onto it:
  - career wizard (was unreadable in light mode; its skill "Add" button did nothing)
  - profile
  - interview entry page
  - flashcards
  - resume analysis
- **Vercel Analytics** added to the root layout.

### Docs
- ADRs for every decision made on 2026-10-24 to 2026-10-26, with an index in `docs/architecture/README.md`.
- `docs/LOCAL_DEVELOPMENT.md` (safe local testing) and `docs/design/soft-glass.md` (building a screen).
- README, environment setup, deployment guide, example env files and agent instructions brought up to date.

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

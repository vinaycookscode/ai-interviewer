# Changelog

Notable changes, newest first. Tickets are in Kaam (project AIIN); the reasoning behind larger changes is in `docs/architecture/`.

## Unreleased

On `develop`, not yet on `main`. Adds the `ActivityDay` and `DailyChallengeAnswer` tables (migration `daily_challenge`, which carries over every past day a plan task was done), the `UserAchievement` and `Certificate` tables (migration `achievements`), `PlacementProgram.track` with the checkpoint columns on `MockInterview` (migration `plan_checkpoints`, which marks the existing `90-day-placement-bootcamp` as the SDE plan), the `CoachConversation` and `CoachMessage` tables with `SubscriptionPlan.coachMessagesPerDay` (migration `coach`: 10 on Free, 100 on paid plans), problem status, hints and history (migration `admin_problems`: every existing problem stays published), and a data fix for three seeded problems' tests (migration `fix_seed_problem_tests`). **After release, run `npx tsx scripts/award-achievements.ts` once against production** to give existing candidates the badges and certificates they've already earned.

- **Daily challenge and one streak.** Each day, candidates get one short aptitude or HR question for their role. It's the same for everyone on a role, all IST day. They answer once; U scores it out of 10 with a line of feedback, then shows the model answer. If U is busy, the answer is saved and scored on the next visit. Today shows the challenge in the streak card.

  There is now **one streak**, shared by Today, the plan and the challenge: a plan task or the challenge keeps it, and both on one day count once. A paused plan no longer holds the streak; the daily challenge keeps it going instead (AIIN-99).

- **Three company prep problems can be solved again.** "Reverse a linked list", "Longest common prefix" and "Maximum subarray" failed their own tests in every kit, even with the reference solution. A single array argument is now written wrapped (`[[1,2,3]]`), and a linked list as `{"list":[1,2,3]}`, which reaches the solution as nodes and is compared as values. The migration fixes existing rows that still hold the original seed tests. `scripts/check-problems.ts` lists any published coding problem whose solution fails (AIIN-219).

- **Problems in the admin console.** Admins can list, search and filter every company prep and daily challenge problem at `/admin/problems`, and create or edit them:
  - statement in Markdown with a preview
  - company kit, type, difficulty, tags and roles
  - starter code and a reference solution
  - test cases (visible or hidden, reorder, remove)
  - up to 3 hints, or a model answer for aptitude and HR
  
  "Check solution" runs the reference solution against every test on the server, in JavaScript until AIIN-105 adds other languages. A coding problem can only be published when its current version passes; a failing case is named, and a change to a published problem that would fail isn't saved. Archived problems leave candidate pages and the daily challenge, and solutions saved for them stay. Every change is in the problem's history with the admin and time. Candidates now see hidden tests as pass or fail only, and the admin's hints one at a time. Every action checks for an admin. The pages are Soft Glass inside the current admin layout; the console itself moves with AIIN-138 (AIIN-107).

- **Ask U, the coach.** A chat with U at `/candidate/coach` (under More). It knows the candidate's career path, their last three practice and interview scores with their strongest and weakest answers, and their plan day and streak, and nothing else: no contact details, documents, employer details or other users. Replies stream in with Markdown, and screen readers hear each one when it's finished. Chats are kept: "New chat" starts fresh, and past ones are listed and can be deleted with their messages. The last 20 messages go back as context. Free accounts get 10 messages a day and paid plans 100, counted on the server per IST day. Deleting a chat doesn't give messages back. At the limit, the box shows when it resets. U stays on careers and interviews, and won't answer questions from an interview in progress. If U can't answer, the message is kept with "Try again", which doesn't use another message (AIIN-100).

- **The 90-day plan fits the career path, with checkpoints.** Each plan has a role track. A candidate whose career path matches one sees it first, marked "Built for your role"; the others follow in their usual order, and without a career path nothing changes. Tasks tagged with skills show "New for you" for a skill the candidate didn't list and "Revision" for one they did. Nothing is hidden. Days 30, 60 and 90 of a 90-day plan have a checkpoint: a five-question practice interview on that phase's topics, which is the day's task and keeps the streak. The plan page shows each score on a timeline with the change ("Up 0.8 since day 30"). Checkpoints don't count towards the practice limit. Each one earns a badge, so there are now 12 badges. The plan's tasks have no skill tags yet, so the labels only appear once tasks are tagged (AIIN-101).

- **Badges and the 90-day certificate.** Badges for real milestones: 7, 14 and 30-day streaks, a first practice interview, five of them, a first score of 8 or more, 7 daily challenges, the plan's checkpoints, 25 company problems solved and 100 flashcards reviewed. Each is stored once and kept, even after the streak behind it ends. A "New badge" toast shows on the next page after one is earned (not during a practice session). "Your badges" (from the profile) lists what's earned with dates and what's left with how to earn it. Today shows the latest one. The plan page's old badge grid is gone. Finishing the 90-day plan gives a public certificate at `/certificate/<code>`, showing only name, plan, date and verification code, with Add to LinkedIn and Copy link. It's kept out of search results, and a wrong code is not found. Badges given by the one-off script show the day it ran as their date. (AIIN-102).

## 2026-10-30, fourth release

On `main` (`001afee`), deploy not yet confirmed. Adds `User.weeklyReportEmails` and the `WeeklyReport` table (migration `weekly_report`). Needs `CRON_SECRET` (16+ random characters) in Vercel's production environment: the Monday job refuses to run without it. `vercel.json` schedules it.

- **Weekly report email.** Every Monday at 9:00 IST, candidates who practised in the last four weeks get a short report on the week before:
  - practice interviews and their average against the week before
  - days active and plan streak
  - flashcards reviewed
  - their best answer and the one to work on
  - one next step
  
  A week with nothing gets a short "We missed you", and after four quiet weeks nothing is sent. A week is never sent twice. "Stop weekly emails" works without signing in, and mail apps get one-click unsubscribe; the profile has an on/off switch. Employers and admins never get it (AIIN-103).

## 2026-10-30, third release

In production (`b89ab95`). Checked locally on a throwaway database before release. Adds the `Interview.startedAt` and integrity columns (migration `integrity_verdict`). **After release, run `npx tsx scripts/compute-integrity.ts` once against production** to compute verdicts for finished interviews (the report also computes them when opened).

- **Integrity on the employer's report.** Each finished interview shows a verdict (No concerns, Worth a look or Strong concerns) with the reasons behind it, a summary (times away, time away, paste attempts, full-screen exits, developer tools) and a timeline grouped by question with mm:ss times. Only the job's employer sees it: not the candidate, and not the PDF. The interview page now also records when the candidate comes back, tells pastes apart from copying, and notes when the interview started; the server only accepts known event types. Rules: [ADR](docs/architecture/2026-10-30-integrity-verdict-rules.md) (AIIN-177).

## 2026-10-30, second release

In production (`a0bf6ce`). Checked locally on a throwaway database before release. No schema changes.

- **New candidates set up their career path first.** After registering, a candidate lands on a four-step set-up (role, skills, resume, goal) in Soft Glass instead of an empty dashboard. Each step is saved as they go, so "Finish later" keeps their answers, and the profile's "Set up my path" and "Change my path" open the same page. Invited candidates still go straight to their interview, and existing users aren't sent there on sign-in. Skills, goal and role are now limited in length on the server (AIIN-52).

## 2026-10-30, first release

In production (`f5003ca`). Each change was checked locally on a throwaway database before release. Adds the `Interview.decision`, `decisionAt`, `decisionById` and `completedAt` columns and the `InterviewDecisionEvent` table.

- **Ranked candidates on each job.** A job's finished candidates are ranked by score (ties go to whoever finished first), with each one's answer spread, strongest and weakest skill, decision and finish date. Filter by decision, score, finish date and status, search by name or email, 50 to a page; the view lives in the URL, and the report's back link returns to it. Unfinished candidates are listed below (AIIN-158; migration `interview_completed_at`).
- **Hiring decisions.** On a finished interview's report, the employer can shortlist, put on hold or reject the candidate, with a note only their team sees, and see every change with who made it and when (IST). Candidates never see it (AIIN-157; migration `hiring_decision`).
- **Error, not-found and empty states in Soft Glass.** A missing page and an error now show U, plain words and two ways forward (the error page adds a short reference to quote). Interview-link screens like "Invalid link" now always lead to your dashboard. Empty lists show U and one next step, and candidate pages have a loading screen (AIIN-137, AIIN-88).
- **Profile, offers, plans and subscription in Soft Glass.** Offers compare total pay side by side, and an offer letter can be attached. Plans use the landing page's cards, with the same Razorpay checkout. Offers can no longer be changed or deleted by other users, and the profile page no longer sends your account record to the browser (AIIN-135).
- **90-day plan in Soft Glass.** Your plan with this week's streak and badges, and each day's tasks and idea. A missed day now shows the streak as 0 straight away (on Today too), and pausing really keeps it. Other users' plan answers can no longer be read, and only you can resume your plan (AIIN-134).
- **Flashcards in Soft Glass.** Decks with what's due today, each deck's cards by stage, and a focused study mode. Private decks can no longer be opened by anyone with the link, shared decks can no longer be edited by users, and deck and study pages need a paid plan (AIIN-133).
- **Company prep in Soft Glass.** A searchable company list, each company's rounds, questions and how it hires, and a full-screen problem solver. Run tests appears only for questions with real tests. Your solved questions can no longer be read by other users, and company pages now need a paid plan when opened directly (AIIN-132).
- **Resume review in Soft Glass.** One page: your resume and an optional job description, then a score, what works, what to fix first, missing keywords, a cover letter and a rewrite. Reviews used to crash as soon as they came back: the page read fields the AI never returns. Server actions that hit an error now return their message instead of crashing on a browser-only toast (AIIN-131).

## 2026-10-29, second release

In production (`7794575`). Each change was checked locally on a throwaway database before release. Adds the `MockInterview.questions` and `Job.archivedAt` columns.

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

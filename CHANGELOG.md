# Changelog

Notable changes, newest first. Tickets are in Kaam (project AIIN); the reasoning behind larger changes is in `docs/architecture/`.

## Unreleased

Migration `verify_existing_emails` marks every existing account's email as verified, so nobody already using the app is blocked; only new sign-ups verify.

- **New accounts verify their email (AIIN-55).** From the approved boards:
  - **After sign-up:** "Check your email", with Send it again (3 an hour) and the way on to setting up a career path. The email's link works for 24 hours; only the newest link works, and only its hash is stored.
  - **The link:** "You're verified" with Start practising, or "This link has expired" with Send a new link (or a nudge to sign in first).
  - **Until verified:** Today shows "Verify your email to start practising" with Send it again, and starting a practice says to verify first. Accounts created from an invitation link count as verified, since the link proved the address.

- **Sign-in and sign-up say what went wrong (AIIN-57).** "Something went wrong!" is gone. The forms now say whether the email has no account, the password doesn't match, there were too many tries (wait 15 minutes), the account was invited but has no password yet, the email already has an account or a pending invitation, the password misses a rule, or the problem is on our side. Each has its next step where there is one (reset your password, create an account, sign in). Red when the person can fix it, lavender when it's a wait or on our side. A failed sign-in keeps the email filled in.

Migration `candidate_context` adds `Interview.candidateContext` and `candidateContextAt`.

- **Candidates see what was flagged and can add their side (AIIN-185).** A finished interview's report now has a "What was flagged" row leading to a page from the approved artboards:
  - **The moments:** each moment noted during the interview, with the question and time, in the same neutral words the employer sees. Never the employer's verdict, review or notes. An interview with nothing noted says so.
  - **Their side:** an optional note of up to 500 characters, sent once to the hiring team. The employer sees it in the integrity section with when it was sent.
  - Only the interview's own candidate can see the page or send the note.

## 2026-11-13, third release

Migration `college_shares` adds `CollegeShare`.

- **Placement officers can follow their own students (AIIN-173).** On a drive's page, each college in the "By college" table has Share, which opens the approved "Share with the placement officer" dialog:
  - **Sharing:** copy the link, or send it to the college's placement officer (remembered for next time) through the email outbox. Links last two weeks past the drive's close by default, up to 60 days. Each link lists its opens and can be turned off.
  - **What the officer sees:** without an account, only that college's students, with name, roll number and how far each got (not started, started, didn't pass aptitude, finished), and filters. "Show who was shortlisted" is off by default; when on, each student shows Shortlisted or nothing. Scores, answers, feedback, other decisions, documents and integrity details are never shown.
  - **Security:** works like shortlist links: only the token's hash is stored, a turned-off or expired link says so, guesses are limited to 30 a minute per address, and pages are never indexed or cached. The emailed link is cleared from the outbox once sent. See the addendum in `docs/architecture/2026-11-12-read-only-share-links.md`.
  - **Privacy policy:** now says drive progress may be shared with the candidate's college's placement officer.

Migration `drive_open_link` adds `Drive.openLinkSlug` (unique), `openLinkOn`, `allowedDomains` and `joinCap`. New dependency: `qrcode`.

- **One open link for a drive, with a QR code (AIIN-168).** A drive's "Open link" page turns on one link students can use to join on their own, from the approved artboards:
  - **For the employer:** the link with Copy, a QR code to print (download as SVG), allowed email domains, a cap on how many can join, and "Make a new link", which stops the old one at once.
  - **For students:** signed out, the link explains the steps and offers Sign up or Sign in, then returns to the drive. Signed in, they pick their college and optionally a roll number, and go straight to the aptitude round or the interview.
  - **Rules:** only candidate accounts can join; someone already in the drive carries on where they left off; the link says plainly when the drive hasn't opened, has closed, is full, or is for other email domains; joins are limited to 20 a minute per address.

- **Live drive dashboard (AIIN-172).** A drive's page is now its dashboard, from the approved artboards:
  - **Funnel:** invited, opened, passed aptitude, started, finished, scored, at or above the cutoff, and shortlisted, each with its count and percent of invited.
  - **By college:** a table with the same counts, which scrolls inside its own box on phones.
  - **Needs attention:** bounced or unsent emails, interviews that couldn't be scored, and integrity flags, each linking to who's affected.
  - **View ranked candidates:** opens the job's ranked list filtered to this drive.
  - **Live updates:** while live, the numbers refresh every 30 seconds ("Updated 20 seconds ago"). Counts come from one grouped query, and a 500-candidate drive loads in about 0.1 s.
  - **Stages:** opening a drive interview link now counts as Opened, and starting and finishing move the candidate's stage.

Migration `answer_grading_queue` adds `Answer.gradingStatus` (`GradingStatus`), `gradingAttempts`, `gradeAfter` and `gradingError`, and marks existing answers graded. Optional: `GRADING_RATE_PER_MINUTE` (default 60).

- **Interviews are graded reliably at volume (AIIN-170).** Answers are queued and graded by one worker at a time, paced under Gemini's rate limit, with retries. Finishing an interview no longer waits for grading. A score appears only once every answer is graded, so lists show "Scoring", never a partial average. An answer that fails 5 times shows "Couldn't score 1 answer · Try again". A Gemini error can no longer be saved as a score of 0. See `docs/architecture/2026-11-13-grade-answers-through-a-queue.md`.
- **Auto-shortlist at a drive's cutoff (AIIN-171).** When a drive interview's score is set, a score at or above the drive's cutoff is shortlisted automatically, recorded as "auto cutoff" with no author. Strong integrity concerns go On hold with "Integrity review needed" instead. It never rejects and never overrides a decision someone made. After changing the cutoff, "Apply the cutoff to undecided candidates" applies it on request.
- **Fix: the aptitude question dialog no longer lays a grey haze over the page in dark mode (AIIN-226).** It dims with the page colour, like the other dialogs.

## 2026-11-13, second release

Migration `aptitude` adds `AptitudeTest`, `AptitudeSection`, `AptitudeQuestion`, `AptitudeAttempt` and the drive's aptitude settings; seed the ready-made test with `npx tsx scripts/seed-aptitude.ts` (it refuses a non-local database without `ALLOW_SEED=1`). Migration `email_outbox` adds `OutboundEmail` (`OutboundStatus`). A new daily cron, `/api/cron/outbox`, needs `CRON_SECRET`; set `RESEND_WEBHOOK_SECRET` (Resend → Webhooks → signing secret) and point a Resend webhook for `email.bounced` and `email.complained` at `/api/webhooks/resend`. Migration `drives` adds `Drive`, `DriveCollege` and `DriveCandidate` (with the `DriveStage` and `DriveSource` enums) and `Interview.driveId`. `scripts/seed-local-test-users.ts` seeds test accounts into a local throwaway database only.

- **Employers write their own aptitude tests (AIIN-226).** Hiring drives now has an "Aptitude tests" tab next to Drives, from the approved artboards. It lists the ready-made tests and your own, each marked Ready, Needs N more, or Locked while in use.
  - **Setting up a test:** a name, the time allowed, whether to shuffle answer options, and named sections that each ask a number of questions per attempt. Each attempt draws its questions from every section's pool.
  - **Adding questions:**
    - write them, with 2 to 6 options, one correct answer and the working;
    - import a CSV, where problems are named by row and imported questions need a check;
    - draft them with AI. Nothing is saved until you press "Answer is right · add".
  - **Rules:**
    - only checked questions are used, and a drive can only pick a test that's ready;
    - a test used by a scheduled or live drive is locked, and "Make a copy" makes an editable copy;
    - ready-made tests can be copied, not edited.
- **Aptitude round with a pass mark (AIIN-169).** A drive can start with a timed aptitude test before the AI interview. You pick the test and a pass mark from 1 to 100% on the drive form.
  - **The ready-made test:** "General aptitude", 30 minutes and 30 questions, drawn from a pool of 45 across quantitative, logical and verbal. Each candidate gets their own questions, with the options shuffled.
  - **For candidates:** the drive email links to the round. After instructions, they get a timer and "Question n of 30" that stay at the top on a phone, 56px answer options, a question grid, and a spoken warning at 5 minutes and 1 minute left. Answers save as they go and survive a reload.
  - **The server keeps time and scores:** answers after the deadline (plus 30 seconds) don't count, and correct answers never reach the browser. An attempt left after its deadline is scored the next time it's opened, or by the daily job.
  - **Results:** passing opens the AI interview straight away ("You've moved to the interview"); otherwise "Thanks for taking part". There's no second attempt.
  - **On the drive page:** passed, didn't pass and taking it now, plus each candidate's percent and how often they left the tab.
- **Invite a drive's candidates by CSV (AIIN-166).** A drive's page has "Invite by CSV" while it's scheduled or live, from the approved artboards, in four steps:
  1. **Upload** a CSV of up to 5,000 rows or 2 MB. Anything else is refused before it's read, and a template is available to download.
  2. **Match columns.** Headers like "Student Name, Email ID, College, PRN" are matched for you, and you can change them.
  3. **Check rows.** Every row is checked before anything is created: ready, invalid email, missing name, duplicate in the file, already in this drive, staff account, or unknown college. You can add unknown colleges to the drive or leave those rows out, and download the problem rows (made safe to open in a spreadsheet).
  4. **Invite.** "Invite N candidates" creates or finds each candidate, adds them to the drive with their college and roll number, creates an interview whose link expires when the drive closes, and queues their invitation in the outbox.

  Uploading the same file twice invites nobody twice. The job's own bulk invite now uses the same code, so neither one can invite an employer's or admin's email.
- **Drive emails reach everyone (AIIN-167).** Drive emails are now queued, never sent inside a request.
  - **Sending:** a worker sends them in batches of 100, paced under Resend's rate limit. An invalid address fails on its own; anything else is retried with backoff up to 5 times.
  - **No duplicates:** two workers can never send the same email.
  - **Reminders:** candidates who haven't started get one reminder when the drive closes within 30 hours.
  - **Bounces:** bounces and spam complaints come back through a signed webhook.
  - **On the drive page:** sent, waiting, failed and bounced counts, with "Resend" for one person or "Resend to all".

  See `docs/architecture/2026-11-13-queue-outbound-email-in-the-database.md`.
- **Hiring drives (AIIN-165).** Jobs → Hiring drives lists every drive with its colleges, dates, and how many were invited, finished and shortlisted. Each drive shows its status as Draft, Scheduled, Live or Closed, and the status comes from its dates, so a drive goes Live and closes without anyone touching it.
  - **Create or edit a drive:** pick a job that has interview questions, give it a name, set the open and close times in India time, and add colleges with an optional city and placement officer email. You can also shortlist automatically, with an interview cutoff out of 10.
  - **Checks:**
    - closing must come after opening;
    - a new drive can't open in the past;
    - auto-shortlisting needs a cutoff;
    - a job without questions is refused with a link to edit it.
  - **Links follow the drive:** interview links expire when the drive closes and move when its closing time moves. Closing early stops unstarted links at once ("This hiring drive has closed"), while interviews already started can still be finished. A drive closed early can be reopened for a week.
  - **History is kept:** a drive with candidates can't be deleted (only closed), moved to another job or turned back into a draft.

## 2026-11-13, release

Migration `job_matches` adds `JobMatch` and `MatchTask`. Migration `invitations` adds `SubscriptionPlan.talentInvitesPerMonth` (Free 10, Pro 50, Premium 200) and `Application.inviteMessage`, `invitedAt` and `inviteExpiresAt`. Migration `human_rounds` adds `HumanRound`. A new daily cron, `/api/cron/matches`, needs `CRON_SECRET` like the others.

- **Interview rounds on an application (AIIN-196).** An application's Rounds list now holds AI and human rounds together, in time order, each with its outcome.
  - **Add an AI round:** sends the usual AI interview invite and link.
  - **Add a round with a person:** name, date and time, length, interviewer and an https meeting link. The candidate gets an email with a calendar invite.
  - **New time or cancel:** sends an updated invite that replaces or removes the event in their calendar.
  - **Outcome:** each human round can be marked Passed, Not passed or Didn't join. AI rounds show their decision.
  - Booking a round from Applied or Screening moves the application to Interviewing.
  - Candidates see the next round's date, time and a Join link in My applications, but never the outcome.

- **Matching engine (AIIN-199).** Every open job with confirmed requirements now has matches. Matches come only from findable candidates who passed the job's place and experience filters, ranked by how close their confirmed facts are to the job. Each match stores:
  - a score that's always the same for the same job and profile: must-haves 45%, relevance of past work 25%, experience 20%, nice-to-haves 10%, rounded to 5;
  - its four parts;
  - three reasons, written by AI for each job's top 20 and based on confirmed facts only, with any missing must-have always named.

  A new job's matches are ready within seconds of confirming its requirements. A candidate who confirms facts or switches findable on is matched straight away, and one who switches off or blocks an employer leaves those lists at once. A daily job retries any failures and refreshes matches older than a week. No match reads a name, gender, age or college. See `docs/architecture/2026-11-12-match-scoring.md`.

- **Matched candidates for a job (AIIN-200).** Each job has a Matches page, from the approved artboards and linked from the job, showing anonymous cards sorted by %:
  - the four parts as bars (must-haves, relevant work, experience, nice-to-haves);
  - reasons, with any missing must-have marked;
  - city, notice and practice score.

  It shows 60% and above by default, or 50, 70 or 80%, or everyone who passes the job's filters, so the ranking never hides anyone. You can filter by experience and city, 12 to a page. There's no filter on name, gender, age or college, and a card never shows a name, contact, employer, college or file. Jobs without confirmed requirements say how to get matches. Invitations come next (AIIN-201).

- **Find jobs and apply directly (AIIN-202).** More → Find jobs lists open jobs whose requirements are confirmed, from the approved artboards. Closed, paused and draft jobs never appear.
  - **Search** by role or skill ("js" finds JavaScript), place (which also includes remote jobs), work mode, minimum pay and "fits my experience".
  - **Sorted by your own match %**, with "You have every must-have" or what's missing. Without confirmed facts, it's newest first, with a nudge to confirm them.
  - **Applying:** a job's page shows its description, needs and your match. Apply takes your phone, which is required and saved on your profile (AIIN-204), and an optional note, and creates an application at Applied, marked "Applied from job search". Your note shows on the employer's application page.
  - **No opt-in needed:** applying shares your name with that one employer.
  - **My applications** gets a coral "Find jobs".

- **Invite to apply, with an invitations inbox (AIIN-201).**
  - **Employers** invite a matched candidate from their card with an optional short message (no links). Invitations come from a monthly allowance per plan (AIIN-204): Free 10, Pro 50, Premium 200, editable in Admin → Subscriptions. The matches page shows how many are left, and the server refuses invitations beyond the allowance, to candidates who blocked the employer, or to anyone who's no longer findable.
  - **Candidates** see Invitations under More, plus a banner on My applications. Each invitation shows the job, company, match % and message, and lasts 14 days. Apply asks for a phone, which is required, and an optional note. Not interested is private.
  - **Privacy:** until a candidate applies, the employer sees only "Invited candidate", or "Candidate who declined" afterwards, with no name, contacts or files. Once they apply, the employer sees their name, email, phone and resume. An employer can open only that candidate's current resume, nothing else in their folder.
  - **Fixed:** the employer's "Jobs" tab was briefly labelled "Find jobs" on `develop`.

## 2026-11-12, second release

Migration `job_requirements` adds `Job.status` (`JobStatus`), the requirement columns and `WorkMode`, and marks existing jobs OPEN (CLOSED if archived). Migration `resume_facts` adds the resume fact columns to `CandidateProfile`. Migration `match_embeddings` adds `Job.embedding` and `CandidateProfile.embedding` (`vector(768)`) with HNSW indexes. Migration `applications` adds `Application` and `ApplicationEvent` with the `ApplicationStage` and `ApplicationSource` enums, and creates an application for every job and candidate that already has an AI interview. Migration `my_applications` adds `Application.candidateSeenAt` and `User.applicationEmails`. Migration `discoverable` adds `CandidateProfile.discoverable` and `discoverableSince`, and the `CandidateBlock` table.

- **Let employers find me (AIIN-198).** Profile → "Let employers find me", from the approved artboards:
  - a switch, off for everyone until they turn it on, which needs confirmed profile facts;
  - what employers never see;
  - a preview of the exact anonymous card employers will see: role, years, top skills, city, notice period, practice score, degree, and a code like "Candidate 4F2A". No name, contacts, employer or college names.
  - a block list: find an employer by name and block them, so they never see or invite you.

  Turning it off takes effect on the next match query; applications already made stay. Matching and search must use `discoverableWhere` (`lib/discovery.ts`), and the card comes from `anonymousCard` (`lib/anonymous-card.ts`) so the preview and employers' cards always match.

- **My applications (AIIN-197).** More → My applications shows every job you applied to, from the approved artboards: Active and Closed tabs, with each job's company and stage in your words (Applied, In review, Interviewing, Offer, Selected, Not selected). The next AI interview shows with its date and a link to its prep set, and "Updated" marks anything that changed since you last looked. You can withdraw from any open application; the employer sees Withdrawn and can't move it after that. "Email me when an application changes" is off until you turn it on. When it's on, you get one email each time an employer moves your application, with the new stage only, never their notes or reasons.

- **Applications: one pipeline per job (AIIN-195).** Each job has an Applications view, from the approved artboards and linked from the job page and the Candidates page. It shows tabs with a count per stage (Applied, Screening, Interview, Offer, Hired, Not moving forward), search by name, and each application's AI score. An application's page shows its AI interview rounds, call notes, history, and Move to: a coral "Move to" for the next stage, Put on hold, Not moving forward with a reason only your team sees, or any other stage. The application now holds a candidate's outcome for a job: shortlisting an AI interview moves it to Screening, and rejecting moves it to Not moving forward. Inviting someone to an AI interview creates their application. An invitation not yet accepted stays anonymous. See `docs/architecture/2026-11-12-applications-hold-the-outcome.md`.

- **Jobs and candidates are embedded for matching (AIIN-194).** Confirming a job's requirements, or a candidate's facts, stores a 768-dimension Gemini embedding of them once the save has gone through, ready for match scores (AIIN-199). A candidate's embedding uses only confirmed facts and their resume with personal details stripped first: name, email, phone, links, gender, age, date of birth, address, photo and college names. Embedding never slows or fails a save. The embedding helper moved to `lib/ai/embeddings.ts`, shared with Question Bank search.

- **Your profile facts, read from your resume (AIIN-193).** Profile → "Check your profile facts" opens a page, from the approved "Resume facts" artboards, where U reads your resume (in about 15 seconds) and lists your jobs, education and skills with years. You check each one ("Looks right", Edit, or remove), or confirm them all, and add what's missing by hand. Only facts you confirm are ever shown to employers or used for matching, and they never include your name, email or phone. A scanned PDF with no text is called out so you can type facts in instead. Uploading a new resume proposes new facts without touching the ones you confirmed. See `docs/architecture/2026-11-12-resume-facts.md`.

- **Job requirements, proposed by AI and confirmed by you (AIIN-192).** After creating a job, step 2 is its requirements, built from the approved "Job requirements" artboards. U reads the description and proposes must-have and nice-to-have skills, years, work mode, location, pay and notice period. You mark each skill, add or remove skills, and confirm. Nothing proposed counts until you confirm. A job opens for Talent Match only with at least one must-have. Skills are named one way ("JS" becomes JavaScript). If U can't answer, you fill it in by hand. Older jobs show "Add requirements to get matches". AI interviews work as before, whatever the job's status. See `docs/architecture/2026-11-12-job-requirements-and-status.md`.

## 2026-11-12, release

Migration `question_bank` adds the `BankItem` table, with the `BankSource` and `BankStatus` enums, and fills it from every existing practice answer. Migration `bank_search` enables the pgvector extension and adds `BankItem.embedding`. Local development now needs pgvector (see `docs/LOCAL_DEVELOPMENT.md`). Migration `bank_ai_answer` adds `BankItem.aiAnswer`. Migration `bank_review` adds the `BankAttempt` table and schedules every question that already has a practice score. Migration `prep_sets` adds `PrepSet` and `PrepSetItem`. Migration `shortlist_shares` adds `ShortlistShare`.

- **Fixed: replaced documents stayed in storage (AIIN-224).** Replacing a PAN, Aadhaar or resume on the profile, or the letter on an offer, now deletes the old file from R2 once the save has gone through, and deleting an offer deletes its letter. A file still used anywhere (the profile, another offer, an interview) is kept, and only the user's own `profiles/<id>/` files are ever deleted. A failed delete never fails the save.
- **Fixed: a crafted file link could reach another user's folder (AIIN-216).** Found while testing uploads against a real R2 test bucket.
  - `/api/files/profiles/<you>/..%2F<them>/<file>` was authorized as your own folder, because the decoded segment `../<them>` isn't exactly `..`. The storage client then resolved it into the other user's folder. R2 refused it only because the request signature no longer matched, so nothing leaked. Every key segment is now checked after decoding, and anything with a slash, backslash, `.` or `..` is not found.
  - Stored file addresses had only a "starts with our bucket" check. Offer letters, plus the resume, PAN and Aadhaar on a profile, now must be the user's own file under `profiles/<id>/` and must read the same once normalized; anything else is refused. Saving a profile with someone else's file now says so. The resume screener only fetches the user's own stored resume. The checks are in `lib/storage-key.ts`.
- **Export a job's candidates to CSV (AIIN-162).** "Export" sits beside Share shortlist on a job's Candidates section. Its dialog, from the approved Export artboards, says how many candidates and which filters ("Shortlisted, any score, any time"), lists the columns, and warns that the file holds emails. Download CSV gets exactly what the ranked list's filters and sort show, every page, in the same order. The columns are rank, name, email, status, decision and its date, overall, lowest and highest answer score, strongest and weakest skill, interview language, finished at (IST) and the report link. The file is named `{job-title}-candidates-{date}.csv` and is UTF-8 with a BOM, so Excel shows Hindi and Marathi names. Cells starting with `=`, `+`, `-` or `@` get a leading `'`, so spreadsheets never run them. It streams in batches: 5,000 rows start downloading at once. Only the job's employer can download it, and it has no documents, transcripts or integrity evidence.
- **Share a shortlist with a hiring manager (AIIN-161).** A job's Candidates section has "Share shortlist". It makes a read-only link labelled for who it's for, with Shortlisted only or Shortlisted and on hold, working for 1, 7 or 30 days. The link is shown once to copy; only a hash of it is stored. Anyone with it sees the shortlist ranked as on the job page, live, with each candidate's summary, answers, transcripts, confidence, culture fit, strengths and weaknesses, without signing in. They never see emails, phone numbers, documents, integrity evidence or notes. The dialog lists active links with when they expire and how often they were opened, and Turn off. A turned-off or expired link says so; a wrong token is not found, and an IP gets 30 tries a minute. Share pages are never indexed or cached and send no Referer. See `docs/architecture/2026-11-12-read-only-share-links.md`.
- **Bulk decisions, with an optional email (AIIN-159).** The selection bar on a job's ranked list now has Shortlist, Hold and Reject. Once a whole page is picked, it also offers "Select all N matching" to cover every page. A confirm dialog, from the approved artboards, lists who's affected, takes an optional note for the team, and has "Email these candidates" (off by default) with a count and a preview. Shortlisted and rejected candidates get an email from "{employer} via Get Back To U", with replies going to the employer; On hold sends nothing. The result shows how many were updated, emailed and skipped, and why: not finished, or strong integrity concerns not yet reviewed. A failed email is listed with Retry, and its decision is saved anyway. Re-applying a decision writes no history and sends nothing. Up to 500 at a time. Any id that isn't the employer's, on this job, refuses the whole call.
- **Compare 2 to 4 candidates side by side (AIIN-160).** On a job's ranked list, each row has a checkbox, and a dark bar appears while any are picked. Compare is enabled for 2 to 4; otherwise it says "Pick 2 to 4 candidates". The compare page, from the approved artboards, has a column per candidate with their score, decision, strongest and weakest skill. Each of the job's questions has a row with every candidate's score, "Best" on the top one, a line of feedback, the full answer on request, and "Not answered" where they skipped it. It also shows a quote from the question they differ on most, confidence and culture fit, and a decision you can change right there. It's a real table, so screen readers announce the question, candidate and score. On a phone it scrolls inside its own box. Candidates from two jobs, or any id that isn't yours, are refused.
- **Candidates, ranked within each job (AIIN-217).** The Candidates page now shows each open job with its top 5 finished candidates (rank, name, score, decision, report), ranked exactly as on the job's own page, with the job that finished most recently first. Search and the decision filter apply across every job and live in the URL. Each job links to its full ranking, and a report's back link returns to the filtered page. The old flat list of every invite, with its status filter, is gone; invites still waiting are on each job's page. Designed and approved on the canvas first ("Candidates by job").
- **Editing a job and copying an invitation, hardened (AIIN-60, AIIN-61).** Both already existed (the edit page and the invite dialog's Copy). Saving a job now checks its title, description and questions on the server, and no longer loads the employer's user row. An added question row left empty is dropped rather than saved as a blank question. If the browser refuses the clipboard, the invite dialog selects the link and says to press Ctrl+C, instead of doing nothing.
- **A prep set for each upcoming interview (AIIN-213).** The Question Bank shows the candidate's next employer interview, with "Open the prep set". The first time it's opened, U picks 15 questions, built from the approved Prep set artboards:
  - the candidate's own bank questions closest to the job's must-have skills, which Gemini reads from the job's title and description;
  - four of the company's Company prep questions, when it has a kit;
  - their weak spots, ranked by closeness to the job;
  - Gemini's suggestions for any gap, marked AI-suggested.

  No two questions are near-duplicates. The employer's own interview questions are never shown to Gemini or included. The page shows progress ("1 of 15 practised · 4 days to go"), how many a day to do, and a coral "Practise the next one". Applications (AIIN-195) don't exist yet, so the set is built when the candidate opens it rather than when an application reaches interviewing.

- **Practise bank questions on a schedule (AIIN-212).** Any question in the bank can be practised by voice or text, on a focus page from the approved artboards. It's graded against Company prep's answer or the AI-written one when there is one. A score of 7 or more moves the question up a box (3 days, then 7, 14 and 30), and anything lower brings it back tomorrow. Two strong answers in a row make it Confident. The same rule applies to answers from regular practice. The bank shows a Due today tab, a chip on due questions and a "Practise the N due" panel. Each question shows its next review, every attempt from practice and from the bank, and a coral "Practise this question". A candidate can have up to 30 bank answers scored per day.

- **Add a question you were asked (AIIN-211).** The Question Bank's coral "Add a question" opens a dialog for a question from a real interview: the question, company, type and how it went. It lands in the bank as a Real interview item that only the candidate sees. Optionally, Gemini writes a model answer, after the response so adding never waits. It shows on the question's page under "See a strong answer", marked AI-written. Suggesting a question to Company prep is left to the moderated path (AIIN-215), because the approved design keeps added questions private.

- **Browse and search the Question Bank (AIIN-210).** A new page, More → Question Bank, built from the approved artboards, lists every question with its status, source, type, company and last score. Filters for source, type and company, plus status tabs with counts, all live in the URL. Search finds words, and also meaning: "caching" finds a question about CDNs, though the word isn't in it. Each question opens to the latest answer and what to fix, a strong answer when Company prep has one, every attempt with its score, and private notes. A new candidate sees how the bank fills itself, with Start a practice and Browse Company prep. Adding a question, the review schedule and the prep set come next (AIIN-211–213).

- **The Question Bank fills itself (AIIN-209).** Every practice answer now lands in the candidate's Question Bank, with the latest answer's score and feedback. A Company prep question appears once, however often it's saved or practised. Each open Company prep question has a "Save to my bank" button. Once saved, it shows "Saved to your bank", and the card says "In your bank". The practice grader now also says whether a question is HR, technical, coding or aptitude. Deleting a bank item keeps the answers it came from. The bank's own page comes next (AIIN-210). ADR: [One item per question](docs/architecture/2026-11-11-one-bank-item-per-question.md).

## 2026-11-02, release

Migration `hide_study_squad_and_mentors` turns both flags off; migration `decision_confirmed_concerns` adds `InterviewDecisionEvent.confirmedConcerns`. Migration `integrity_reviews` adds the `IntegrityReview` table and `Interview.integrityReviewOutcome`. Migration `mock_answer_bank_link` adds `MockInterview.bankQuestionIds` and `MockAnswer.companyQuestionId`. Migration `best_solutions` adds the `ProblemSolution` table.

- **Study Squad and Mentors are hidden until they work (AIIN-75).** Neither had a way for people to actually work together: no messages, no verified mentors. Their flags are now off (a missing flag used to count as on), they're gone from the menu, and a direct link finds nothing. Every action behind them needs the flag and a signed-in user. "My squads" and "my mentorships" now return only your own, and a mentor's email is no longer sent to the browser.
- **Integrity on the ranked list (AIIN-178).** Each finished interview shows its integrity verdict as a chip with an icon and words ("No concerns", "Worth a look", "Strong concerns", or "Not checked" when there's none yet), in the table and on phones. A new filter shows one verdict at a time, kept in the URL with the other filters. Shortlisting a candidate with "Strong concerns" now asks to confirm first, and the decision history says it was confirmed.
- **Employers review integrity flags (AIIN-179).** A flagged interview (Worth a look or Strong concerns) has a Review button in its integrity section: No issue, or Confirmed with a required note that only the team sees. Every review is kept in a history, and the latest shows on the report and on the ranked list ("Reviewed: no issue" or "Confirmed concern"). Once reviewed as No issue, shortlisting a Strong concerns candidate no longer asks to confirm. A new admin page, Integrity reviews, counts reviews by the rule that flagged them, to tune the thresholds, with no one named.
- **Candidates can delete their account (AIIN-58).** A "Delete your account" section on the profile, confirmed by typing the email, deletes the account and everything in it at once, removes their files from storage, signs them out and shows "Your account is deleted". Interviews they did for employers stay with the employer as "Deleted candidate", with the score, verdict and the employer's decision, but without name, email, answers or documents. The admin console's delete, which failed for any candidate with an interview, now uses the same path. The landing page's privacy note says deletion is self-service. ADR: [Deleting an account](docs/architecture/2026-11-02-deleting-an-account.md).
- **A privacy page (AIIN-222).** `/privacy` sets out what we collect and why, who processes it (Gemini, the browser's speech service, Vercel, Neon, R2, Resend, Razorpay, our code runner), the interview integrity checks, how long data is kept, and your rights, with hello@getbacktou.com as the grievance contact. Every claim was checked against the code. It's linked from the landing footer, sign-up and the interview consent notice. For now it names the operator as "its founder" (`DATA_OPERATOR` in `lib/legal.ts`); the owner's name replaces it later.
- **Best solutions for every coding problem (AIIN-221).** After a candidate submits an attempt, the problem shows two or three approaches, from brute force to optimal, each with its time and space complexity, a short explanation and code in JavaScript, Python, Java and C++. Gemini writes them; every language of every approach runs against all the problem's tests, hidden ones included, and only code that passes is stored and shown. Generated the first time someone opens a problem's solutions, then reused. The old "Show the solution" panel, and the reference solution the page sent to every browser, are gone, because they gave the answer away before any attempt. ADR: [Best solutions](docs/architecture/2026-11-02-best-solutions-checked-before-shown.md).
- **Practice answers graded against a model answer (AIIN-208).** Each practice now asks one behavioural question from the question bank (an HR question the candidate hasn't practised before), last, after four that Gemini writes for the role. Its answer is linked to the bank question and graded against the bank's model answer and tips, so the feedback says what a strong answer has that theirs didn't. Plan checkpoints keep to their topics. This is the groundwork for the Question Bank (AIIN-206).
- **No pause between interview questions (AIIN-38).** Each answer used to wait for Gemini to grade it, several seconds of "Saving your answer…" every time, before the next question appeared. Now the answer is saved and the next question shows at once (about 40 ms locally), and the grading runs on the server after the response with Next's `after()`. The last answer, and any that failed to grade, are graded when the interview completes, as before. The unused public `gradeAnswer` action is removed.
- **The landing page claims nothing that isn't true (AIIN-80).** The made-up numbers ("10,000+ interviews", "95% success", "500+ companies", "#1 AI interview platform", "join thousands") were no longer shown, and are now deleted so they can't come back. The privacy note no longer promises self-service account deletion, which doesn't exist yet (AIIN-58). It says to write to us, and that AI features send answers and documents to Gemini. The footer year is current.

## 2026-11-01, third release

Adds the `InterviewConsent` table and `Interview.consentDeclinedAt` (migration `interview_consent`), and a daily cron, `/api/cron/retention`, which needs `CRON_SECRET` (already set).

- **Candidates agree to the integrity checks before an interview starts (AIIN-176).** After the documents step and before the camera is asked for, a notice says exactly what's checked: tab and window, full screen, copy and paste with shortcuts and developer tools, a second screen, and face presence on the device, with no video, audio or photo recorded. It says why, what's kept and for how long, and who sees it, in English, Hindi or Marathi.
  - "I agree and start" and "I don't agree" are equally prominent. Agreeing records the notice version, the checks, the language, the time, the IP and the browser.
  - Declining starts nothing and lets the employer see it. The candidate can change their mind until the link expires.
  - The server refuses to start an interview, or store any integrity event, the candidate hasn't agreed to. A new notice version asks again, but never halfway through an interview.
  - The employer's integrity section says whether and when the candidate agreed, never the IP or browser.
  - Integrity events are now deleted after a year, as the notice says.
  - ADR: [Integrity checks and candidate data](docs/architecture/2026-11-01-integrity-checks-and-candidate-data.md).

## 2026-11-01, second release

- **Company prep remembers where you left off (AIIN-220).** A problem now reopens in the language you last saved, with your code, instead of always in JavaScript, which made a saved Python solution look lost. Each problem says **Solved** (every test passed) or **Attempted**, with an icon and a word, in the list and in the solver, and it updates as soon as you submit. Only solved problems count towards "done". The reference solution says which language it's written in. The save and load actions return only the counts and the code, not the database row.

## 2026-11-01, release

Adds the `ActivityDay` and `DailyChallengeAnswer` tables (migration `daily_challenge`, which carries over every past day a plan task was done), the `UserAchievement` and `Certificate` tables (migration `achievements`), `PlacementProgram.track` with the checkpoint columns on `MockInterview` (migration `plan_checkpoints`, which marks the existing `90-day-placement-bootcamp` as the SDE plan), the `CoachConversation` and `CoachMessage` tables with `SubscriptionPlan.coachMessagesPerDay` (migration `coach`: 10 on Free, 100 on paid plans), problem status, hints and history (migration `admin_problems`: every existing problem stays published), a data fix for three seeded problems' tests (migration `fix_seed_problem_tests`), and the `CodeRun` table (migration `code_runs`). **Needs `RUNNER_URL` and `RUNNER_TOKEN` in Vercel's production environment** for code to run on the server: our Piston server on Oracle Cloud's free tier (`docs/CODE_RUNNER_SETUP.md`; the values are in the local `.env.local`). Without them, practice falls back to JavaScript in the browser, and the interview's Run button says it can't run code right now. **After release, run `npx tsx scripts/award-achievements.ts` once against production** to give existing candidates the badges and certificates they've already earned.

- **Daily challenge and one streak.** Each day, candidates get one short aptitude or HR question for their role. It's the same for everyone on a role, all IST day. They answer once; U scores it out of 10 with a line of feedback, then shows the model answer. If U is busy, the answer is saved and scored on the next visit. Today shows the challenge in the streak card.

  There is now **one streak**, shared by Today, the plan and the challenge: a plan task or the challenge keeps it, and both on one day count once. A paused plan no longer holds the streak; the daily challenge keeps it going instead (AIIN-99).

- **Code runs on the server, in JavaScript, Python, Java and C++.** Our own Piston server, on Oracle Cloud's free tier, runs candidate code (`lib/judge/`): 10 s, 256 MB, no network, and output cut at 64 KB. Setup and upkeep are in `docs/CODE_RUNNER_SETUP.md`.
  - **Company prep:** every language checks against the tests, hidden ones included. The page never receives hidden tests, and results show them only as passed or not. Starter code in each language matches what the tests call. Submitted solutions are re-checked on the server, so the browser's counts no longer count.
  - **Live interviews:** the Run button works in JavaScript, TypeScript, Python, Java, C++ and C#. It's only for the candidate's own interview while it's in progress. This replaces the old call to the public Piston service, which had no login check and has refused public requests since February 2026.
  - **Admins:** "Check solution" runs a reference solution written in any of the four languages.
  - **Limits and logs:** 30 runs a minute per person; each run logs language, time and status, never the code.
  - **Without the judge:** JavaScript runs its visible tests in the browser.
  
  TypeScript is no longer offered in company prep: it never ran there. Decision: [ADR](docs/architecture/2026-10-30-code-execution-hosting.md), now accepted (AIIN-105).

- **The admin console is in Soft Glass.** Each screen follows its approved design:
  - **Frame:** a header with the section pill, the AI model picker, Leave admin and the theme switch.
  - **Overview:** tiles, the newest sign-ups, and what needs a look.
  - **Users:** search and role filters on the server, not just the current page. Deleting an account means typing its email, and an admin can't delete their own account.
  - **Subscriptions:** revenue tiles, every subscriber with search and status filters, plan cards with an edit dialog, and a confirmed downgrade of unpaid accounts.
  - **Visitors:** a top-countries table with shares. The map, and the CDN file it loaded, are gone.
  - **Features:** grouped on/off switches.
  - **Feedback:** an accordion with status filters and counts. Deleting asks first.
  - **Sample data:** the seed page.
  
  Every screen works by keyboard, in light and dark; under 768 px it says it's made for a computer.
  
  **Security fixes:**
  - Turning a feature off for everyone (`toggleFeatureFlag`) had no auth check, so anyone could call it. It now needs an admin, as does `seedFeatureFlags`.
  - The seed modules behind `/api/seed-placement` were public Server Actions; they're now plain server modules.
  - Plan edits and feedback statuses are validated on the server (AIIN-138).

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

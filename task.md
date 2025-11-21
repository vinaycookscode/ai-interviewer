# AI Interviewer - Project Tasks

## Phase 1: Foundation & Architecture
- [x] **Project Initialization**
    - [x] Initialize Next.js app with TypeScript, ESLint, Prettier, Tailwind CSS
    - [x] Install and configure `shadcn/ui` core components
    - [x] Set up project folder structure
- [x] **Database Schema Design**
    - [x] Set up Prisma with PostgreSQL
    - [x] Define models: `User`, `Job`, `Interview`, `Question`, `Answer`
- [x] **Authentication & Role Management**
    - [x] Integrate Authentication (Clerk/NextAuth)
    - [x] Implement Role-Based Access Control (Employer vs Candidate)

## Phase 2: Employer Portal
- [x] **Job Management Dashboard**
    - [x] Create Job (Form with JD, skills, experience)
    - [x] List Active Jobs
    - [/] Edit/Delete Jobs (Delete implemented)
- [x] **AI Question Generator**
    - [x] Integrate LLM (OpenAI/Gemini)
    - [x] Implement "Generate Questions from JD" feature
    - [x] Question Editor (Manual override)
- [x] **Candidate Invitation System**
    - [x] Generate unique interview links
    - [x] Email invitation system (Resend API configured)

## Phase 3: The Interview Engine (Candidate Side)
- [x] **Pre-Interview System Check**
    - [x] Camera & Microphone permission check
    - [x] Audio visualizer test
- [/] **Live Interview Interface**
    - [x] Real-time Camera Feed
    - [x] Text-to-Speech (AI Voice)
    - [x] Speech-to-Text (Real-time transcription)
- [x] **Context-Aware AI Logic**
    - [x] Connect Interview flow to LLM
    - [x] Implement dynamic follow-up questions

## Phase 4: Analysis & Reporting
- [x] **Automated Scoring Engine**
    - [x] Analyze transcripts against rubric
    - [x] Score Technical Accuracy, Communication, Relevance
- [x] **Feedback Report Generation**
    - [x] Generate detailed feedback for Candidates
    - [x] Generate summary report for Employers
- [x] **Analytics Dashboard**
    - [x] Visual charts for candidate performance

## Bugs & Improvements
- [x] **Sign Out Issue**: Signing out shows a white screen instead of redirecting to sign-in page.
- [x] **Candidate List**: Show candidate names with their invitation links in Job Details.
- [x] **Review Interface**: Show recordings and answers for each candidate.
- [x] **Candidate Auth**: Require signup/login before accessing the interview page.
- [x] **UI Polish**: Improve overall aesthetics (Clear and Aesthetic look).
- [x] **UX Fix**: Ensure all clickable items have `cursor-pointer`.

### New Issues
- [x] **Score Visibility**: Score is not visible for the candidate after completing interview.
- [x] **Role-Based Access Control**: Candidates can currently access employer features (create jobs, etc.). Need to implement proper role-based permissions.
- [x] **Candidates Page**: The "Candidates" navigation link is not working (page not implemented).
- [x] **Settings Page**: The "Settings" navigation link is not working (page not implemented).
- [x] **Interview Link**: Fix undefined URL in email invitations.
- [x] **Feedback Score**: Ensure scores are calculated and saved upon interview completion.

### Future Enhancements
- [x] Implement Candidates page (list all candidates across all jobs)
- [x] Implement Settings page (user profile, preferences, etc.)
- [x] Add role-based middleware to restrict candidate access to employer features
- [x] Show feedback/score to candidates after interview completion
- [x] **Analytics Dashboard**: Visual charts for candidate scores and interview status.
- [x] **Context-Aware AI Logic**: Dynamic follow-up questions based on candidate answers.
- [x] **Improved Interview Flow**: Public landing page and smart account switching for candidates.
- [x] **Candidate Deletion**: Ability to delete candidates/interviews.
- [x] **Date/Time Precision**: Added time to "Invited On" and "Job Created".
- [x] **Dark Mode**: Comprehensive dark theme with pure black backgrounds and white text.
- [x] **Chart Polish**: Fixed CSS alignment in analytics charts.
- [x] **Email Notifications**: Employers get notified on interview completion.
- [x] **PDF Export**: Downloadable interview feedback reports.
- [ ] **Edit Job Functionality**: Allow employers to edit existing job details.
- [ ] **Account Deletion**: Allow users to delete their account and data.

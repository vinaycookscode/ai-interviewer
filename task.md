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

## New Feature Implementation

### Phase 1: Critical Fixes
- [x] **Fix PDF Download**: PDF download working on employer feedback page and accessible to candidates via "View Feedback" button.

### Phase 2: User Type System
- [x] **User Type Selection**: Add user type selection (Candidate/Employer) on signup page.
- [/] **Vercel Deployment**: Deploy application to Vercel
- [/] **Domain Setup**: Connect custom Cloudflare domain
- [x] **Database Setup**: Set up production database (Neon/Vercel Postgres)
- [/] **Role-Based Access**: Implement proper role-based routing and access control (page-level, not middleware due to edge runtime).

### Phase 3: Smart Authentication Flow
- [x] **Interview Link Handler**: Check if user exists when accessing interview link.
- [x] **Conditional Auth**: Redirect to login if user exists, signup if new user.
- [x] **Auto-redirect**: After auth, redirect back to interview link.

### Phase 4: Candidate Portal Redesign
- [x] **Candidate Dashboard**: Show only interviews with dates and status.
- [x] **Migration: Clerk to Custom Auth**
    - [x] **Setup & Configuration**
        - [x] Uninstall Clerk packages (`@clerk/nextjs`, `@clerk/themes`)
        - [x] Install Auth.js packages (`next-auth@beta`, `@auth/prisma-adapter`, `bcryptjs`)
        - [x] Configure `auth.ts`, `auth.config.ts`, and `routes.ts`
    - [x] **Database Migration**
        - [x] Update Prisma schema (User, Account, Session models)
        - [x] Run database migration (`npx prisma db push`)
    - [x] **Backend Implementation**
        - [x] Create server actions for Login and Register (`actions/auth.ts`)
        - [x] Update `middleware.ts` for route protection
        - [x] Refactor existing actions (`interview.ts`, `job.ts`) to use new auth
    - [x] **Frontend Implementation**
        - [x] Create Login page (`app/auth/login/page.tsx`) and form
        - [x] Create Register page (`app/auth/register/page.tsx`) and form
        - [x] Create custom `UserButton` component
        - [x] Update `DashboardHeader` to use new `UserButton`
    - [x] **Cleanup**
        - [x] Remove old Clerk pages (`app/sign-in`, `app/sign-up`)
        - [x] Remove Clerk webhooks
        - [x] Verify all Clerk references are removed
- [x] **Simplified Navigation**: Remove employer-specific features from candidate view.
- [x] **Candidate Layout**: Add dedicated layout with sidebar and profile options for candidates.
- [x] **Document Upload**: Allow candidates to upload required documents before interview.

### Phase 5: Document Management System
- [x] **Job Document Requirements**: Add checkboxes for required documents (Resume, Aadhar, PAN) when creating job.
- [x] **Database Schema**: Add document fields to Interview/Candidate model.
- [x] **Document Upload UI**: Create document upload interface for candidates.
- [x] **Document Validation**: Ensure candidates upload all required documents before starting interview.
- [x] **Document Storage**: Implement file upload and storage (local storage in public/uploads).

### Phase 6: Theme Verification
- [x] **Dark Theme Testing**: All new pages use theme-aware classes (bg-background, bg-card, text-foreground).
- [x] **Light Theme Testing**: All components properly support light theme.
- [x] **Theme Consistency**: All new components use theme-aware Tailwind classes.

### Phase 7: Final Polish
- [x] **Role Visibility**: Display user role (Candidate/Employer) in dashboard header and settings.
- [x] **Dark Theme Fixes**: Ensure Clerk components and all dashboard sections fully support dark theme.
- [x] **Hydration Fixes**: Resolve hydration errors in candidate dashboard.
- [x] **Build Fixes**: Resolve dependency conflicts with Clerk packages.

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
- [x] **Vercel Deployment**: Deploy application to Vercel
- [x] **Domain Setup**: Connect custom Cloudflare domain (`getbacktou.com`)
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

### Phase 8: Manual Invitation System
- [/] **Remove Resend**: Disable automated email sending.
- [ ] **Manual Invite UI**: Create "Copy Invitation" interface for employers.

---

# 🚀 Product Roadmap: Daily Engagement Features

## 🎯 Vision
Transform from "Interview Tool" to "Career Growth Platform" that candidates use daily.

---

## Phase 1: Hook Features (Foundation) - Q1 2026

### 1. Daily Skill Challenge
- [ ] **Backend**
  - [ ] Create `DailyChallenge` model (question, difficulty, category, date)
  - [ ] Implement challenge rotation algorithm (personalized by skill level)
  - [ ] Create API endpoints for fetching daily challenge
  - [ ] Add streak tracking logic
  
- [ ] **Frontend**
  - [ ] Create `/candidate/daily-challenge` page
  - [ ] Build challenge card UI with timer
  - [ ] Implement streak counter component
  - [ ] Add completion animation/celebration
  - [ ] Create challenge history view
  
- [ ] **Gamification**
  - [ ] Streak counter (7-day, 30-day, 100-day badges)
  - [ ] Daily reminder notifications
  - [ ] Leaderboard by skill domain

### 2. Performance Dashboard & Analytics
- [ ] **Backend**
  - [ ] Create analytics aggregation service
  - [ ] Weekly performance report generator
  - [ ] Trend analysis algorithm (ML-based insights)
  - [ ] Comparison data (anonymized peer benchmarking)
  
- [ ] **Frontend**
  - [ ] Redesign `/candidate/dashboard/analytics` with charts
  - [ ] Weekly performance report email template
  - [ ] Progress over time visualization (Chart.js/Recharts)
  - [ ] "Areas to Improve" recommendations panel
  - [ ] Shareable achievement cards (LinkedIn integration)
  
- [ ] **Metrics to Track**
  - [ ] Response time trends
  - [ ] Clarity score (NLP-based)
  - [ ] Confidence metrics (voice analysis)
  - [ ] Question type performance breakdown

### 3. AI Career Coach (MVP)
- [ ] **Backend**
  - [ ] Implement chat API integration (OpenAI/Gemini)
  - [ ] Context builder (user history + current session)
  - [ ] Rate limiting for free tier (10 messages/day)
  - [ ] Conversation memory storage
  
- [ ] **Frontend**
  - [ ] Create `/candidate/ai-coach` chat interface
  - [ ] Message history persistence
  - [ ] Quick action buttons (Resume Review, Mock Interview, etc.)
  - [ ] Usage meter (messages remaining today)
  
- [ ] **Coach Capabilities**
  - [ ] Career advice
  - [ ] Resume optimization suggestions
  - [ ] Mock interview conversations
  - [ ] Salary negotiation practice

---

## Phase 2: Retention Features - Q2 2026

### 4. Personalized Learning Path
- [ ] **Backend**
  - [ ] Initial skill assessment quiz
  - [ ] Learning path generator (30/60/90-day roadmap)
  - [ ] Progress tracking system
  - [ ] Adaptive difficulty adjustment
  
- [ ] **Frontend**
  - [ ] Onboarding flow with skill assessment
  - [ ] Learning path visualization (roadmap UI)
  - [ ] Daily checklist component
  - [ ] Progress dashboard

### 5. Community & Peer Learning
- [ ] **Backend**
  - [ ] Forum/discussion model (posts, comments, reactions)
  - [ ] Study group creation and management
  - [ ] Peer matching algorithm (interview buddies)
  - [ ] Reputation/karma system
  
- [ ] **Frontend**
  - [ ] Create `/candidate/community` section
  - [ ] Discussion forums by company/role
  - [ ] Study group finder
  - [ ] Success stories feed
  - [ ] Peer review interface for practice interviews

### 6. Achievement System & Micro-Certifications
- [ ] **Backend**
  - [ ] Achievement definition system
  - [ ] Progress tracking for certifications
  - [ ] Verification logic (AI + peer review)
  - [ ] Badge generation API
  
- [ ] **Frontend**
  - [ ] Achievement showcase page
  - [ ] Certification exam interface
  - [ ] Progress indicators
  - [ ] LinkedIn badge sharing integration
  
- [ ] **Certifications to Build**
  - [ ] System Design Expert
  - [ ] Behavioral Interview Master
  - [ ] Data Structures & Algorithms Pro
  - [ ] Leadership Communication

---

## Phase 3: Monetization & Network Effects - Q3 2026

### 7. Company Intelligence Feed
- [ ] **Backend**
  - [ ] Crowdsourced question submission system
  - [ ] Question validation and categorization (AI)
  - [ ] Company hiring trends scraper
  - [ ] Job matching algorithm
  
- [ ] **Frontend**
  - [ ] Create `/candidate/insights` page
  - [ ] Daily digest feed
  - [ ] Company-specific interview prep pages
  - [ ] Contribution interface (submit questions → earn credits)

### 8. Job Match Engine with Auto-Apply
- [ ] **Backend**
  - [ ] Job scraper (LinkedIn, Indeed, company sites)
  - [ ] Matching algorithm (skills + preferences)
  - [ ] Resume/cover letter AI optimizer
  - [ ] Application tracking system
  
- [ ] **Frontend**
  - [ ] Create `/candidate/jobs` section
  - [ ] Job recommendations feed
  - [ ] One-click apply workflow
  - [ ] Application status dashboard
  - [ ] Interview prep materials generator per job

### 9. Referral Network
- [ ] **Backend**
  - [ ] Employee verification system
  - [ ] Referral request/response workflow
  - [ ] Credit system for helping others
  - [ ] Company employee directory
  
- [ ] **Frontend**
  - [ ] Create `/candidate/referrals` page
  - [ ] Employee search and filtering
  - [ ] Referral request templates
  - [ ] Credit balance and history

### 10. Premium Tiers & Monetization
- [ ] **Backend**
  - [ ] Subscription management (Stripe integration)
  - [ ] Feature gating by tier
  - [ ] Usage tracking and limits
  - [ ] Upgrade flow logic
  
- [ ] **Frontend**
  - [ ] Pricing page
  - [ ] Upgrade prompts in-app
  - [ ] Billing dashboard
  - [ ] Premium features showcase
  
- [ ] **Pricing Tiers**
  - [ ] Free: Daily challenge, basic analytics, 3 AI messages/day
  - [ ] Pro ($19/mo): Unlimited AI, advanced analytics, certifications
  - [ ] Premium ($49/mo): Human mock interviews, priority matching, referrals

---

## Infrastructure & Supporting Features

### Technical Debt & Performance
- [ ] Implement Redis caching for frequently accessed data
- [ ] Add CDN for static assets
- [ ] Optimize database queries (add indexes)
- [ ] Implement lazy loading for heavy components
- [ ] Add service worker for offline support

### Notifications & Communication
- [ ] Push notification system (Firebase/OneSignal)
- [ ] Email campaign automation (welcome series, weekly digest)
- [ ] SMS notifications for streaks/reminders
- [ ] In-app notification center

### Analytics & Monitoring
- [ ] Implement product analytics (Mixpanel/Amplitude)
- [ ] User session recording (Hotjar/LogRocket)
- [ ] A/B testing framework
- [ ] Performance monitoring (Sentry)

### Security & Compliance
- [ ] GDPR compliance review
- [ ] Data export/deletion workflows
- [ ] Rate limiting for all public APIs
- [ ] Security audit

---

## Success Metrics (KPIs)

### Engagement Metrics
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- DAU/WAU ratio (stickiness)
- Average session duration
- Feature adoption rates

### Retention Metrics
- Day 1, 7, 30 retention rates
- Streak retention (% of users with 7+ day streaks)
- Churn rate by cohort

### Growth Metrics
- New user sign-ups
- Referral rate
- Viral coefficient
- Social shares

### Revenue Metrics
- Free to paid conversion rate
- Monthly Recurring Revenue (MRR)
- Customer Lifetime Value (LTV)
- Churn by pricing tier

---

## Implementation Guidelines

### Development Workflow
1. Create feature branch from `develop`
2. Build backend API first (TDD approach)
3. Create frontend components
4. Write integration tests
5. Deploy to staging
6. User testing
7. Merge to `develop`
8. Deploy to production

### Quality Standards
- All new features must have tests (min 80% coverage)
- No console.log in production code
- All user-facing text must use i18n
- Mobile-responsive by default
- Accessibility compliant (WCAG 2.1 AA)

### Launch Strategy
- Soft launch to 10% of users
- Gather feedback via in-app surveys
- Iterate based on data
- Full rollout after 1 week

---

## Current Focus (Next Sprint)
**Priority: Phase 1 - Daily Skill Challenge**

Starting with the highest-impact, lowest-effort feature to drive daily engagement.

---

# 💻 Phase 4: Full-Fledged Coding Platform

## 🎯 Vision
Build a production-grade coding preparation environment with real-time code execution, test cases, and comprehensive feedback system.

---

## Core Components

### 1. Code Editor Integration
- [x] **Frontend Setup**
  - [x] Install Monaco Editor (`@monaco-editor/react`)
  - [x] Create `CodeEditor` component wrapper
  - [x] Implement syntax highlighting (Python, JavaScript, Java, C++)
  - [x] Add IntelliSense/auto-completion
  - [x] Implement themes (VS Code Dark, Light, High Contrast)
  - [x] Add keyboard shortcuts (Ctrl+S, Ctrl+/, etc.)
  - [x] Font size adjustment controls
  - [x] Line numbers and minimap
  - [x] Error detection and linting
  - [x] Vim/Emacs mode toggle (power users)

- [x] **Multi-Language Support**
  - [x] Language selector dropdown
  - [x] Language-specific templates
  - [x] Syntax validation per language
  - [x] Default code stubs for each language

### 2. Code Execution Engine
- [x] **Option A: Judge0 API Integration** (Quick MVP)
  - [x] Set up Judge0 API credentials
  - [x] Create `/api/execute` endpoint
  - [x] Send code + language + test cases to Judge0
  - [x] Parse and return results
  - [x] Handle rate limits and quotas
  
- [x] **Option B: Custom Docker Sandbox** (Advanced)
  - [x] Set up Docker infrastructure (AWS ECS/GCP Cloud Run)
  - [x] Create language-specific Docker images
  - [x] Implement job queue (Bull/Redis)
  - [x] Resource limits (CPU: 1 core, Memory: 256MB, Time: 5s)
  - [x] Security isolation (no network, no file system access)
  - [x] Container pooling for performance
  - [x] Auto-scaling configuration

### 3. Database Schema
- [x] **CodingProblem Model**
  ```prisma
  model CodingProblem {
    id              String   @id @default(cuid())
    title           String
    slug            String   @unique
    difficulty      String   // EASY, MEDIUM, HARD
    description     String   @db.Text
    
    // Multi-language templates
    pythonTemplate  String?  @db.Text
    jsTemplate      String?  @db.Text
    javaTemplate    String?  @db.Text
    cppTemplate     String?  @db.Text
    
    // Test cases
    testCases       Json     // [{input, output, hidden}]
    
    // Metadata
    topics          String[] // ["Arrays", "Hash Tables"]
    companies       String[] // ["Google", "Amazon"]
    difficulty      String   // "EASY", "MEDIUM", "HARD"
    frequency       Float    @default(0)
    
    // Constraints
    timeLimit       Int      @default(5000)  // ms
    memoryLimit     Int      @default(256)   // MB
    
    submissions     Submission[]
    
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
  }
  ```

- [x] **Submission Model**
  ```prisma
  model Submission {
    id          String   @id @default(cuid())
    userId      String
    problemId   String
    
    code        String   @db.Text
    language    String   // "python", "javascript", etc.
    
    // Results
    status      String   // "ACCEPTED", "WRONG_ANSWER", "TLE", "RUNTIME_ERROR"
    passedTests Int
    totalTests  Int
    runtime     Int      // ms
    memory      Int      // KB
    
    // Feedback
    feedback    String?  @db.Text
    score       Int?     // 0-100
    hints       Json?    // Hints used
    
    createdAt   DateTime @default(now())
    
    user        User     @relation(fields: [userId], references: [id])
    problem     CodingProblem @relation(fields: [problemId], references: [id])
  }
  ```

### 4. Problem Page UI/UX
- [x] **Split Screen Layout**
  - [x] Left panel: Problem description (40% width)
  - [x] Right panel: Code editor + console (60% width)
  - [x] Resizable divider
  - [x] Mobile responsive (stack vertically)

- [x] **Problem Description Panel**
  - [x] Problem title and difficulty badge
  - [x] Company tags (clickable filters)
  - [x] Topic tags
  - [x] Description with examples
  - [x] Constraints section
  - [x] Follow-up questions

- [x] **Code Editor Panel**
  - [x] Language selector
  - [x] Theme toggle
  - [x] Font size controls
  - [x] Reset to template button
  - [x] Full-screen mode

- [x] **Console/Output Panel**
  - [x] Tabs: Test Cases | Results | Discussion
  - [x] Custom test case input
  - [x] Run Code button (runs visible tests)
  - [x] Submit button (runs all tests including hidden)
  - [x] Results display (pass/fail with details)

### 5. Test Case System
- [ ] **Test Case Structure**
  - [ ] Public test cases (visible to user, 2-3 cases)
  - [ ] Hidden test cases (prevent hardcoding, 5-10 cases)
  - [ ] Edge cases (null, empty, large inputs)
  - [ ] Performance test cases (time/space complexity validation)

- [ ] **Test Execution Flow**
  - [ ] Parse test case inputs
  - [ ] Execute code with each test case
  - [ ] Capture stdout, stderr, return value
  - [ ] Compare with expected output
  - [ ] Measure execution time and memory
  - [ ] Generate detailed feedback

- [ ] **Custom Test Cases**
  - [ ] Allow users to add custom inputs
  - [ ] Validate input format
  - [ ] Show output for debugging

### 6. Hints & Progressive Help
- [ ] **Smart Hint System**
  - [ ] Time-based hints (stuck for 5 min → Hint 1)
  - [ ] Progressive difficulty (3 levels)
  - [ ] Hint 1: Conceptual nudge
  - [ ] Hint 2: Approach suggestion
  - [ ] Hint 3: Pseudocode
  - [ ] Final: Show similar solved problem

- [ ] **AI Code Review**
  - [ ] Analyze submitted code
  - [ ] Suggest optimizations
  - [ ] Detect common mistakes
  - [ ] Complexity analysis
  - [ ] Best practices feedback

### 7. Performance & Security
- [ ] **Optimizations**
  - [ ] Pre-warm Docker containers (pool of 10-20)
  - [ ] Redis caching for test results
  - [ ] WebSocket for real-time feedback
  - [ ] Code compilation caching
  - [ ] Horizontal scaling for execution workers

- [ ] **Security Measures**
  - [ ] Sandboxed execution (Docker isolation)
  - [ ] Resource limits enforcement
  - [ ] Disable network access in containers
  - [ ] Code scanning for dangerous imports
  - [ ] Rate limiting (10 submissions/min per user)
  - [ ] CAPTCHA for suspicious activity

### 8. Supported Languages (Priority Order)
- [ ] **Tier 1: Must-Have**
  - [ ] Python 3.x
  - [ ] JavaScript (Node.js)
  - [ ] Java
  - [ ] C++

- [ ] **Tier 2: Popular**
  - [ ] C
  - [ ] TypeScript
  - [ ] Go

- [ ] **Tier 3: Nice-to-Have**
  - [ ] Rust
  - [ ] Kotlin
  - [ ] Swift

### 9. Problem Management (Admin)
- [ ] **Problem Creation Interface**
  - [ ] Rich text editor for description
  - [ ] Test case builder (input/output pairs)
  - [ ] Template code for each language
  - [ ] Difficulty selection
  - [ ] Topic/company tagging
  - [ ] Preview mode

- [ ] **Problem Import**
  - [ ] LeetCode problem scraper (for inspiration)
  - [ ] Bulk import from JSON/CSV
  - [ ] Problem validation checks

### 10. Student Preparation Features
- [ ] **Adaptive Problem Selection**
  - [ ] Skill assessment quiz (initial)
  - [ ] Personalized problem queue
  - [ ] Difficulty progression algorithm
  - [ ] Company-specific problem sets

- [ ] **Spaced Repetition System**
  - [ ] Track solved problems
  - [ ] Schedule re-attempts (Day 3, 7, 15, 30)
  - [ ] Retention score tracking
  - [ ] Daily revision queue

- [ ] **Progress Dashboard**
  - [ ] Problems solved by difficulty
  - [ ] Topic mastery heatmap
  - [ ] Streak counter
  - [ ] Company readiness score
  - [ ] Time investment tracking

---

## Implementation Phases

### Phase 1: MVP (Weeks 1-4)
- [ ] Monaco Editor integration
- [ ] Judge0 API setup
- [ ] Basic problem model and schema
- [ ] Simple problem page with editor
- [ ] Run code functionality (visible tests only)
- [ ] 20 curated problems (10 Easy, 8 Medium, 2 Hard)

### Phase 2: Core Features (Weeks 5-8)
- [ ] Full submission system with hidden tests
- [ ] User submission history
- [ ] Problem filtering and search
- [ ] Multi-language support (Python, JS, Java, C++)
- [ ] Test case management
- [ ] 100+ problems across topics

### Phase 3: Advanced Features (Weeks 9-12)
- [ ] Custom Docker execution (migrate from Judge0)
- [ ] Hint system
- [ ] AI code review
- [ ] Spaced repetition system
- [ ] Performance optimizations
- [ ] Admin problem management interface

### Phase 4: Preparation Engine (Weeks 13-16)
- [ ] Adaptive learning paths
- [ ] Company-specific problem sets
- [ ] Skill assessment and diagnostics
- [ ] Progress analytics
- [ ] Interview simulation mode
- [ ] Peer code review

---

## Technical Stack

### Frontend
- React/Next.js
- Monaco Editor (`@monaco-editor/react`)
- TailwindCSS
- WebSocket (Socket.io client)

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Redis (caching + queue)
- Bull (job queue)

### Execution Environment
- **MVP:** Judge0 API
- **Production:** Docker + AWS ECS/GCP Cloud Run
- Redis for job management

### Monitoring
- Sentry (error tracking)
- CloudWatch/GCP Monitoring (infrastructure)
- Custom analytics for submission metrics

---

## Success Metrics

### Engagement
- Daily active coders
- Problems attempted per user
- Average time spent coding
- Streak retention

### Quality
- Submission success rate
- Code execution success rate (no crashes)
- Average execution time
- User satisfaction (thumbs up/down on problems)

### Growth
- Problem library growth rate
- User skill progression rate
- Company readiness improvement

---

## Risks & Mitigation

**Risk 1: Code execution costs**
- Mitigation: Start with Judge0 (cheaper), migrate to custom when user base justifies

**Risk 2: Security vulnerabilities**
- Mitigation: Strict sandboxing, regular security audits, rate limiting

**Risk 3: Performance at scale**
- Mitigation: Container pooling, caching, horizontal scaling

**Risk 4: Problem content quality**
- Mitigation: Editorial review process, community voting, test case validation

---

## Integration with Existing Platform

This coding platform will integrate with existing features:
- [ ] Link from "Daily Skill Challenge" → Coding problems
- [ ] "AI Career Coach" can recommend specific problems
- [ ] Progress tracked in main dashboard
- [ ] Company prep packs include coding problem sets
- [ ] Mock interviews can include live coding rounds


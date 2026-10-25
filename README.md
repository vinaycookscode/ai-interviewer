# Get Back To U

AI mock interviews for campus placements and first jobs. Live at [getbacktou.com](https://getbacktou.com).

**For candidates**
- Practise interviews out loud with an AI interviewer that scores every answer and says what to fix.
- Resume review against a job description.
- A 90-day placement programme.
- Company-specific prep with a code editor.
- Flashcards.

**For employers**
- Invite-only accounts.
- Invite candidates to an AI first-round interview.
- Get a scored, proctored report.

## Stack

| | |
|---|---|
| App | Next.js 16 (App Router, webpack dev), React 19, TypeScript |
| UI | Tailwind CSS v4, shadcn/ui, **Soft Glass** design language (`components/soft-glass/`) |
| Data | PostgreSQL on Neon, Prisma 7 with migrations |
| Auth | NextAuth v5, email and password, JWT sessions |
| AI | Google Gemini (`gemini-2.5-flash` by default) |
| Payments | Razorpay |
| Email, storage | Resend, Cloudflare R2 |
| i18n | next-intl (`messages/en.json`) |

## Run it locally

Read [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md) first. Never run against the production database: `npm run dev` refuses to.

```bash
npm install
npm run dev        # http://localhost:3000, needs DATABASE_URL pointing at a dev or local database
```

| Script | What it does |
|---|---|
| `npm run dev` | Checks the database isn't production, then starts `next dev` |
| `npm run build` | `prisma generate`, checks `DATABASE_URL` and the production guard, `prisma migrate deploy`, `next build` |
| `npm run start` | Serves a production build |
| `npm run lint` | ESLint |
| `npm run deploy:preview` / `deploy:prod` | Deploy with the Vercel CLI (pushing to `develop` / `main` deploys too) |

## Branches and environments

| Branch | Environment | Database |
|---|---|---|
| `main` | Production | Neon `ep-delicate-firefly` |
| `develop` | Preview | Neon `ep-flat-paper` |
| `feature/*` | Merged into `develop` | — |

Environment variables: [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md). Deploying: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Docs

| Doc | For |
|---|---|
| [`docs/architecture/`](docs/architecture/README.md) | Architecture decision records: why things are the way they are |
| [`docs/design/soft-glass.md`](docs/design/soft-glass.md) | How to build a screen in Soft Glass |
| [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md) | Running and testing locally, safely; checking UI changes |
| [`docs/ENVIRONMENT_SETUP.md`](docs/ENVIRONMENT_SETUP.md) | Environment variables per environment |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Deploying and the post-deploy checklist |
| [`docs/audits/`](docs/audits/2026-10-24-master-decision-index.md) | The 2026-10-24 product, UX, speech and per-feature audits, with current status |
| [`CHANGELOG.md`](CHANGELOG.md) | What changed, by date |
| [`AGENTS.md`](AGENTS.md) | Instructions and conventions for AI coding agents |

## Working on it

- **Tasks:** tracked in Kaam, project **AIIN** (see the [ADR](docs/architecture/2026-10-24-track-work-in-kaam.md)).
- **Commits:** conventional subjects that name the ticket, for example `fix: require interview ownership in grading (AIIN-116)`.
- **Schema changes:** `npx prisma migrate dev --name <change>`, then commit the migration. Never `prisma db push`.
- **UI changes:** check light and dark, 320 to 1280px, and the keyboard before calling them done.
- **Decisions:** record significant ones as an ADR in `docs/architecture/`.

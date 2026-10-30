# Building a screen in Soft Glass

How to move a screen to Soft Glass, the product's design language. Why we chose it is in the [ADR](../architecture/2026-10-25-soft-glass-design-language.md). Progress is tracked in Kaam epic **AIIN-123**.

**Design first.** Every screen is drawn and approved on the [design canvas](https://claude.ai/artifact/Q1hFq3HP7UtDQ34dRQ17uQ) before it is built ([ADR](../architecture/2026-10-25-design-first-on-the-canvas.md)).
- The values come from the [Soft Glass design system](https://claude.ai/artifact/2JZbtdJ8oyWeAcKrRep3JQ).
- Build from the approved artboard for your screen: its HTML carries the exact layout, copy, sizes and states.
- If the screen has no artboard yet, design it first.

**Already in Soft Glass** (on `develop`)
- Landing: `app/page.tsx`
- Auth: `app/auth/*`
- App shell: `components/soft-glass/app-shell.tsx`, in the candidate and employer layouts
- Today: `app/candidate/dashboard/page.tsx`
- Practice: `app/candidate/practice/**`, `components/practice/practice-session.tsx`
- Interview session and its link screens: `app/interview/[id]/*`, `components/interview/*`
- Document upload: `app/candidate/interview/[id]/documents`
- Feedback report: `components/feedback/feedback-report.tsx`
- Employer dashboard: `app/dashboard/**`
- Upgrade prompt: `components/subscription/upgrade-prompt.tsx`
- Resume review: `app/candidate/resume-screener`, `components/candidate/resume-*` (AIIN-131)
- Company prep and the problem solver: `app/candidate/company-prep/**`, `components/company-prep/*` (AIIN-132)
- Flashcards: `app/candidate/flashcards/**` (AIIN-133)
- 90-day plan: `app/candidate/placement-program/**`, `components/placement/*` (AIIN-134; the task content inside each task is not restyled yet)
- Profile, offers, plans and subscription: `app/candidate/{profile,offers,pricing,settings}/**` (AIIN-135)
- Career path set-up (onboarding): `app/candidate/onboarding`, `components/candidate/career-wizard.tsx` (AIIN-52)
- Daily challenge: `app/candidate/challenge`, the streak card on Today (AIIN-99)
- Badges: `app/candidate/badges`, the badges panel on the profile, the "New badge" toast, the public certificate `app/certificate/[id]` (AIIN-102)
- Plan checkpoints: the timeline on `app/candidate/placement-program`, the checkpoint card and skill labels on the plan day (AIIN-101)
- Ask U: `app/candidate/coach` (AIIN-100)
- Admin problems: `app/admin/problems` and the editor, in `AdminGlass` inside the old admin layout until AIIN-138 (AIIN-107)
- Weekly report email and unsubscribe: `lib/weekly-report/email.ts`, `app/unsubscribe` (AIIN-103)

**Still to build:** AIIN-136 to AIIN-138. Their artboards are in canvas batches 4 and 6.

**Good references to copy from**
- A page inside the app shell: `app/dashboard/page.tsx`, `app/candidate/dashboard/page.tsx`
- A focus page: `components/practice/practice-session.tsx`
- A form: `components/jobs/job-form.tsx`, `components/auth/login-form.tsx`
- A dialog: `components/interviews/invite-candidate-dialog.tsx`

## 1. The root

Soft Glass tokens only exist inside an element with the `soft-glass` class.

- **Pages inside the app shell** (`app/candidate/*`, `app/dashboard/*`) already have it. The layouts provide `.soft-glass`, the fonts and `AmbientLight`. Don't add another root: a nested `.soft-glass` paints over the shell's light.
- **Focus pages** (practice session, interview) use `FocusRoot` from `components/interview/session-shell.tsx`.
- **Public pages** opt in at their own root:

```tsx
import { softGlassFonts } from "@/lib/fonts";
import { AmbientLight } from "@/components/soft-glass/ambient-light";

<div className={cn(softGlassFonts, "soft-glass relative min-h-screen overflow-x-clip text-base leading-6")}>
    <AmbientLight />
    <div className="relative mx-auto max-w-[1160px] px-4 sm:px-8">…</div>
</div>
```

- `softGlassFonts` loads Fraunces and Plus Jakarta Sans for this subtree only.
- Use `overflow-x-clip`, **not** `overflow-hidden`. Hidden creates a scroll container and breaks `position: sticky` headers.
- Page gutter: 16px on phones, 32px from `sm`.

## 2. Tokens and utilities

All defined in `app/design-system.css`. Light and dark values switch automatically with the `.dark` class.

| Use | Class |
|---|---|
| Page background | `bg-sg-bg` (set by `.soft-glass`) |
| Text, secondary text | `text-sg-text`, `text-sg-muted` |
| Glass card | `sg-glass` (+ `sg-shadow-lg` for a hero card) |
| Bubble, popover | `sg-glass-strong` |
| Floating bar (sticky header) | `sg-bar`: more opaque, so text stays readable over any section |
| Inset row inside a card | `bg-sg-row` |
| Chip, hover fill | `bg-sg-chip` |
| Track (gauge, progress) | `bg-sg-track` / `stroke-sg-track` |
| Divider | `bg-sg-rule` / `border-sg-rule` |
| Main call to action | `bg-sg-coral text-sg-coral-ink` (use `coralButton`) |
| Secondary button, active nav | `bg-sg-ink text-sg-ink-foreground` |
| Scores, tags, feedback panels | `bg-sg-lavender-soft text-sg-lavender-ink`, accent `sg-lavender` |
| Form field edge | `border-sg-field-border`: 50% ink in light, 35% white in dark, at least 3:1 (use `fieldInput`) |
| Keyboard focus | `outline-sg-focus`: deep lavender in light, lavender in dark (use `focusRing`) |
| Error, success | `text-sg-danger`, `text-sg-success` (+ `/10` backgrounds) |

**Type**
- Headings: `font-display sg-soft` (Fraunces with its soft axis). Body: Plus Jakarta Sans, the default inside `.soft-glass`.
- The softness utility is `sg-soft`, **not** `font-soft`. `cn()` (tailwind-merge) treats any unknown `font-*` class as a font family and silently drops `font-display`.

| Role | Size used today |
|---|---|
| Hero heading | 38px below 360px · 44 · 56 from `sm` · 62 from `lg` |
| Section heading | 32/38 · 44/50 from `sm` |
| Card heading (Fraunces) | 23/29 · 28/34 from `sm` |
| Card heading inside the app | `text-display-2xs` (22/28, weight 600) with `font-display sg-soft` |
| Auth card heading | 30/36 · 34/40 from `sm` |
| Body | 16/24 |
| Smallest text (captions, chips) | 13/18; never below 13px for words |

The full list of type styles is in the design system. When you need a size that isn't a named style, add it to `app/design-system.css` instead of writing it inline (see the [size-scale ADR](../architecture/2026-10-25-design-system-size-scale.md)).

## 3. Components

| Component | File | Use it for |
|---|---|---|
| `Mascot`, `UMark` | `components/soft-glass/mascot.tsx` | U, the coach, with a face (tips, empty and error states, auth cards). `UMark` is the logo without expression. Decorative unless you pass `label`. |
| `AmbientLight` | `components/soft-glass/ambient-light.tsx` | The blurred coral and lavender light behind a screen. Once per page. |
| `ScoreGauge` | `components/soft-glass/score-gauge.tsx` | A half-ring score out of 10. On a tinted panel, pass `arcClassName="stroke-sg-lavender-ink"`: plain lavender is too faint there (about 2.5:1). |
| `CoachBubble` | `components/soft-glass/coach-bubble.tsx` | A tip from U: mascot plus speech bubble. |
| `ThemeSwitch` | `components/soft-glass/theme-switch.tsx` | Light/dark toggle (next-themes). |
| `LandingMenu` | `components/soft-glass/landing-menu.tsx` | The header menu below `lg`. Closes on link, Escape or a tap outside. Its panel is solid, not glass, so large text behind it doesn't bleed through. |
| `AppShell` | `components/soft-glass/app-shell.tsx` | The signed-in shell: header nav, More and account menus, and a bottom tab bar below 1024px. Used by the layouts only ([ADR](../architecture/2026-10-25-app-shell-navigation.md)). |
| `FocusRoot`, `FocusCard`, `SessionHeader` | `components/interview/session-shell.tsx` | Focus pages with no app nav: the session header with progress dots, and centred cards for the steps before and after a session. |
| `StatusScreen` | `components/layout/status-screen.tsx` | A full-screen state the user can't continue past (expired link, not open yet…), with at most one next step. |
| `UpgradePrompt` | `components/subscription/upgrade-prompt.tsx` | Shown in place of a paid feature on the free plan. |
| `DialogPanel`, `AlertDialogPanel` | `components/interviews/sg-dialog.tsx` | Dialog panels. Portals render outside the page root, so each panel brings its own `.soft-glass`. |
| `PageHeading`, `StatusChip`, `DocumentChips`, `Figure` | `components/jobs/employer-ui.tsx` | Page heading with back link and actions; status and document chips (icon plus word); a stat figure; panel and button class strings; `formatShortDate`. |

**Shared class strings** in `components/soft-glass/classes.ts`. Use these instead of writing your own:

| Export | What it is |
|---|---|
| `focusRing` | The focus ring every interactive element uses: 2px solid `sg-focus` with a 2px gap, keyboard only. `outline-solid` is explicit, so it also shows on elements whose base classes set `outline-none` |
| `coralButton` | Main call to action; add the height and width at the call site (`h-12 w-full`, `h-14 px-7`) |
| `fieldInput` | Overrides for the shadcn `Input`: 48px soft field with 16px text, so iOS doesn't zoom on focus |
| `fieldLabel` | Overrides for `FormLabel` |
| `fieldError` | Overrides for `FormMessage` |

## 4. Layout on every width

Build for 320px first.

- **Header.** Use the `sg-bar` pill.
  - Below `lg` (1024px) the nav links move into `LandingMenu`.
  - Below `sm` (640px) Sign in and the theme switch move into the menu too.
  - Below 360px, "Start free" moves into the menu.
  - Measure the header at 320px: brand, buttons and menu icon must fit **inside the pill**.
- **Buttons.** Primary button rows stack full width on phones (`flex-col sm:flex-row`).
- **Grids.** Grids of three go to one column below `md` or `lg`. Never squeeze three cards into 221px columns.
  - Lists of steps become compact rows on phones, with the number beside the text.
- **Padding.** Tighten it on phones: cards `p-6` → `sm:p-8`; radius `24px` → `sm:32px`.
- **Content panels.** Compose them in flow (flex or grid with `gap`). Don't scatter absolutely positioned pieces around a card: it reads as "scattered UI" and breaks on narrow screens.

## 5. Accessibility

- One `h1` per page. The brand in the header is a `span`, not a heading.
- Every interactive element is a real `<a>`, `<button>` or `<input>` with `focusRing`.
- Toggles use `aria-pressed`; menus use `aria-expanded` and `aria-controls`.
- Decorative previews and illustrations get `aria-hidden="true"`, and contain no focusable elements.
- Error messages use `role="alert"`; success messages use `role="status"`.
- Touch targets are at least 40px; form fields and menu rows 48px.
- Text contrast is at least 4.5:1 in **both** themes. Check muted text on tinted panels and anything placed on glass over the ink band.
- Status (decisions, interview status, payment results, flags) is told by an icon and a word, never by colour alone.
- One coral call to action per view. Other actions use ink, glass or outline buttons.

## 5b. Data and server boundaries

- A server component must not import a constant or array from a `"use client"` module: it gets a client reference, not the value, and crashes at runtime. Put shared constants in a plain module, like `app/dashboard/candidates/status-filters.ts`.
- Pass client components exactly the props they use, built at the call site. Never pass a database row, especially one that includes a user ([ADR](../architecture/2026-10-26-send-the-client-only-what-it-needs.md)).

## 6. Done means

Follow the checklist in [`docs/LOCAL_DEVELOPMENT.md` → Checking a UI change](../LOCAL_DEVELOPMENT.md#checking-a-ui-change) (light and dark; 320 to 1280px with nothing overflowing its own container; keyboard; console; type check). Then:

- Remove the old classes (liquid-glass, hardcoded emerald, cyan or teal) from the files you touched.
- Update the screen's story in Kaam, including how you checked it.

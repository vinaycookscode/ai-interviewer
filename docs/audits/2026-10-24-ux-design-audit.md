# UX & Design Audit — Get Back To U
**Date:** 2026-10-24  
**Score:** 38 / 100 — Does not yet feel like a product

---

## The Core Problem

The product has no visual identity of its own. What exists is a combination of:
- Default shadcn/ui New York theme as the base
- Cyan/teal/emerald Tailwind color classes scattered everywhere
- A "liquid glass" system copied from Apple iOS 26 (commented as such in `globals.css`)
- A gradient-heavy landing page that looks like a Framer template

The result is a product that looks assembled, not designed. A user who has seen 10 other Next.js SaaS products will recognise the patterns immediately and not feel like they're using something distinctive.

---

## Issue 1 — No Design System. Colors Are Hardcoded.

**The biggest design debt in the codebase.**

`globals.css` defines the correct token system (`--primary`, `--accent`, `--ring`, etc.) but the brand's actual accent color — teal/emerald — is **not in the token system at all**. It lives as hardcoded Tailwind classes throughout every component:

```
text-emerald-400   text-cyan-400   bg-emerald-500
from-cyan-600      to-teal-600     shadow-emerald-500/20
border-emerald-500/20    text-teal-400 ...
```

A search finds 200+ instances across the codebase. This means:
- Changing the brand color requires touching 50+ files
- Dark and light mode behavior is inconsistent because Tailwind's emerald-400 is the same in both modes
- The sidebar's active state, button colors, score chips, and badges are all different shades of green with no systematic relationship

**Decision needed:** Define `--brand` and `--brand-foreground` tokens in globals.css. Replace all hardcoded emerald/cyan/teal references with `bg-brand`, `text-brand`, `border-brand`. This one change would make the design system coherent and the brand color swappable.

---

## Issue 2 — The Landing Page Looks Like a Template

`app/page.tsx` — the hero section has:
- 4 layered `<div>` gradient backgrounds
- 2 animated blob elements with `animate-pulse delay-1000`
- A `bg-[radial-gradient(ellipse_at_top_left,...)]` inline style
- A `bg-[radial-gradient(ellipse_at_bottom_right,...)]` inline style
- A third radial gradient centered
- A shimmer animation on the nav bar that runs on a 6-second loop

This is the visual signature of generic landing pages. Every SaaS template on Tailwind UI, Framer, and Vercel templates uses this exact approach: dark background + cyan/teal/emerald radial gradients + animated blobs + glassmorphism nav.

The product competes in the interview prep space — it should look like it belongs there. References to study: Notion, Linear, Luma, Superhuman. All built strong visual identities by doing less, more precisely.

**What to remove:**
- All `animate-pulse` blobs
- The 4 background gradient layers → reduce to 1 subtle gradient or none
- The shimmer on the nav (`liquid-shimmer` class on the header) — a nav that shimmers constantly is distracting

**What to add:**
- A screenshot or animation of the actual interview UI as the hero visual
- One strong typographic statement with a real typeface (not Geist Sans)
- Social proof with real numbers

---

## Issue 3 — Dual Personality Between Landing and App

The landing page is cyan/teal-heavy, bright, and gradient-forward.  
The interview session is `#070709` background — a completely different dark world.  
The candidate dashboard is a mix of both.

These feel like three different products. A user who lands on the homepage and then opens the interview session will feel disoriented. There is no visual continuity.

**Root cause:** No shared design language. The landing was styled one way, the interview session was styled to look "premium/dark", and the dashboard is somewhere between.

**Decision needed:** Pick one visual register for the entire product and apply it consistently. The dark, focused interview session aesthetic is the right one — it communicates seriousness. The landing page should preview this world, not contrast with it.

---

## Issue 4 — The App Header Has Too Much Noise

`components/dashboard/header.tsx`:

```
Logo | "Get Back To U" | ............. | [Gemini Flash ▼] | [vinay candidate] | 🌙 | Avatar
```

Problems:
1. **Gemini model selector is in the main header** — an admin/technical control visible to all users. Most users have no idea what "Gemini Flash 2.0" means. Move to Settings.
2. **User role badge** shows "candidate" next to the user's name. This is obvious and wastes space.
3. **"Get Back" in foreground + "To U" in gradient** — the logo text split looks awkward in light mode and doesn't read as intentional branding.
4. **The ModeToggle (dark/light)** is a utility action that sits alongside navigation — it should be in a settings menu or user dropdown.

A clean header for this product would be: `Logo | [breadcrumb/page title] | ............. | [User avatar dropdown]`. Everything else moves into the dropdown.

---

## Issue 5 — The Sidebar Has 12 Items Competing Equally

`components/candidate/sidebar.tsx`:

All 12 nav items have the same visual weight. The only differentiation is a tiny "PRO" badge on 7 of them. For a free-tier user, the nav is mostly locked features they can't use.

**Problems:**
- No visual hierarchy between primary actions (My Interviews, Practice) and secondary ones (Offers, Mentors)
- "PRO" badges create friction — every time a user scans the nav they see barriers
- 3 section dividers ("Core Navigation", "Career Tools", "Subscription") add labels without reducing cognitive load
- The active state is a 1px emerald bar on the left edge — barely visible

**What a focused sidebar looks like:**
```
[Profile avatar + name]

My Interviews      ← primary, always visible
AI Practice        ← primary
Resume Screener    ← primary

─── Placement ───
90-Day Program
Company Prep

─── Account ───
Settings
Upgrade            ← single clear upgrade prompt, not scattered PRO badges
```

---

## Issue 6 — Empty States Are Not Designed

When a new user first opens the dashboard, they see:

- "Upcoming Interviews (0)" with a dashed border box: `"No pending invitations found"`
- "Past Interviews (0)" with the same dashed box
- Three metric tiles showing `—` and `Pending evaluations`

This is the lowest-value first impression. A new user who sees this immediately feels the product is empty and has nothing to offer them.

**Every empty state should:**
1. Explain what this section is for
2. Show what it will look like when populated (a ghost/skeleton preview)
3. Give a clear action: "Get your first interview invitation" or "Start a practice session"

The `career-wizard.tsx` component already exists and was built for onboarding. It is not wired to the new user flow.

---

## Issue 7 — Light Mode Is Broken in the App Interior

The sidebar uses hardcoded dark-mode values:
```
text-zinc-400          ← fixed dark gray (invisible on light bg)
hover:text-zinc-100    ← fixed light text (wrong on light bg)
bg-white/[0.08]        ← almost transparent (wrong on light bg)
border-white/[0.08]    ← white border (invisible on light bg)
```

The sidebar will render as nearly invisible text in light mode. The design was built dark-first and light mode was not tested.

Same issue exists in `interview-session.tsx` which is fully hardcoded to the dark theme and cannot render in light mode at all.

---

## Issue 8 — Typography Has No Character

The entire product uses Geist Sans — Vercel's house typeface. It's clean and technically good, but it is strongly associated with Vercel/Next.js products. Any user who has used v0, Vercel, or any template built on it will unconsciously feel this product is a template.

The product is in the interview prep space. It's about careers, performance, growth. The typography should carry some of that weight.

**Options to consider:**
- A strong geometric sans for headings (DM Sans, Plus Jakarta Sans, Bricolage Grotesque)
- Keep a monospace for data/scores (already done with Geist Mono — this part is good)
- System font stack for body text to keep it fast and readable

---

## Issue 9 — "Get Back To U" Does Not Read as a Product Name

The name is informal, hard to type as a URL (getbacktou.com), and does not communicate what the product does. A first-time visitor reading the name cannot guess the product category.

This is a strategic naming question, not a CSS fix. But it affects every design decision — the logo, the tagline, the tone of copy, the visual identity.

If the name stays: lean into it fully with a strong typographic treatment and a mascot/symbol that makes it memorable.  
If the name changes: the product is at an early enough stage that a rename is viable.

---

## Issue 10 — "Candidate Flight Deck" and Other Borrowed Metaphors

The dashboard header says "Candidate Flight Deck" in a pill badge. The section header says "Welcome back". The interview is an "Interview Studio". The metrics are "Readiness Score" and "Bootcamp Roadmap".

Each metaphor came from a different inspiration and they don't cohere. Flight deck + bootcamp + studio are three different worlds. Pick one metaphor system and commit to it, or use plain, direct language and let the product speak.

---

## Priority Order for Design Work

| Priority | Issue | Effort | Impact |
|---|---|---|---|
| P1 | Define brand tokens in globals.css, replace hardcoded colors | Medium | Enables everything else |
| P1 | Fix light mode in sidebar and app interior | Low | Correctness |
| P2 | Redesign landing page hero — remove blobs/gradients, add real product screenshot | Medium | First impression |
| P2 | Wire onboarding (`career-wizard.tsx`) to new user flow | Low | Retention |
| P2 | Clean up header — remove Gemini selector, role badge, ModeToggle | Low | Polish |
| P3 | Redesign empty states with illustrations + actions | Medium | New user experience |
| P3 | Reduce sidebar to 6–7 items with clear hierarchy | Low | Navigation clarity |
| P3 | Introduce a second typeface for headings | Low | Visual identity |
| P4 | Resolve landing ↔ app visual register mismatch | High | Brand coherence |
| P4 | Evaluate product name | High | Strategic |

---

## What Good Looks Like (References)

These products are not templates. Study them:
- **Linear** — dark, precise, no decorative gradients. Every pixel has a function.
- **Luma** — strong typographic identity, minimal chrome, the content is the design.
- **Superhuman** — premium feel through spacing and restraint, not visual complexity.
- **Notion** — neutral enough to feel professional, distinct enough to be memorable.

The interview session UI in this product is actually close to the right register — dark, focused, purposeful. The rest of the product should meet it there.

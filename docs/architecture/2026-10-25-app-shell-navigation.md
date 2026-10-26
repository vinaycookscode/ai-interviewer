# App shell: a floating header and a bottom tab bar instead of the sidebar
**Date:** 2026-10-25  
**Status:** Accepted — implemented (AIIN-125, on `develop` since 2026-10-26)  
**Deciders:** Vinay, Engineering

## Context

The candidate sidebar listed 12 equal-weight items, used hardcoded dark colours that broke light mode, and carried a Gemini model selector and role badge that meant nothing to candidates (UX audit items 2, 5 and 7: AIIN-85, AIIN-86, AIIN-89). Employers had a separate sidebar. On phones the sidebar became a drawer, so the main destinations were always two taps away.

## Decision

One shell component, `components/soft-glass/app-shell.tsx`, used by `app/candidate/layout.tsx` and `app/dashboard/layout.tsx` (designed in batch 1, AIIN-143).

**Candidates**
- Desktop (from 1024px): a floating glass header.
  - Main destinations: **Today · Interviews · Practice · Resume · 90-day plan**.
  - A **More** menu in three groups: Prepare (Company prep, Flashcards), Progress (Analytics, Offers), Community (Study squad, Mentors).
  - On the right: **Go Pro** (free plan only), the theme switch, and an account menu (Profile, Plans and billing, Sign out).
- Below 1024px: a sticky bottom tab bar (Today, Interviews, Practice, Resume, More). The More sheet holds the 90-day plan and the More groups.

**Employers:** Overview · Jobs · Candidates · Settings, plus **New job**.

**For every role**
- The active item comes from the route (`aria-current="page"`).
- Menus close on Escape (focus returns to their button), on a tap outside, or when focus leaves them. There is a skip link to `#main`.
- Items hide when their feature flag is off.

**Focus pages have no app chrome.** A live practice session (`/candidate/practice/[id]`) and the interview (`/interview/[id]`) bring their own session header (`components/interview/session-shell.tsx`), so the shell renders only its children there.

**The shell owns the Soft Glass root.** The layouts provide `.soft-glass`, the fonts and `AmbientLight`. Pages rendered inside them must not add their own root: a nested `.soft-glass` paints over the shell's light.

## Consequences

**Easier:** Five clear destinations instead of twelve. Light mode works. On phones the main destinations are one tap away. Candidates and employers share one tested component.

**Harder:**
- Screens not yet moved to Soft Glass render inside the new shell; their old `bg-background` wrappers show as solid blocks until each screen moves (AIIN-131 to AIIN-138).
- There is no candidate "Interviews" page yet. The tab links to Today's interviews list (`/candidate/dashboard#interviews`).
- The old `components/dashboard/header.tsx` stays until the admin console moves (AIIN-138).

## Alternatives considered

- **Keep the sidebar, restyled.** It fixes the colours but not the twelve-item hierarchy or the phone experience.
- **A hamburger menu on phones.** It hides the main destinations; a tab bar keeps them visible.

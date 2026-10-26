# Soft Glass: the product's design language
**Date:** 2026-10-25  
**Status:** Accepted — core screens on `develop` since 2026-10-26; the rest in progress (epic AIIN-123)  
**Deciders:** Vinay, Engineering

## Context

The UX audit scored the product 38/100: it "looks assembled, not designed". The landing page and the app interior felt like two products, and the existing "liquid glass" layer was copied from Apple's iOS styling.

Three fresh directions were designed on the [design canvas](https://claude.ai/artifact/Q1hFq3HP7UtDQ34dRQ17uQ) (private to the owner until shared):

- **A · Focus Room:** dark, precise, teal.
- **B · Coach's Notebook:** light, editorial, ink blue.
- **C · Momentum:** bright, electric blue and yellow.

All three were rejected as too plain and generic, with the wrong colours, fonts and layout. The brief that came out of that review:

- A mix of Apple-style glassy premium and Headspace or Duolingo friendliness.
- Light and dark designed equally.
- A fresh start, not built on the uncommitted liquid-glass redesign.

## Decision

Adopt **Soft Glass** for every screen.

**The look**
- **Surfaces:** frosted glass cards over soft coral and lavender ambient light.
- **Accents:** coral (`#f28c6b`) for the main call to action; lavender for scores and tags; near-black ink for secondary buttons and active navigation.
- **Type:** Fraunces with its `SOFT` axis for headings, Plus Jakarta Sans for everything else.
- **Mascot:** U, a "U" with a face, speaks the coaching tips and carries empty and error states.
- **Navigation:** a floating glass nav pill instead of a sidebar. On phones the nav moves into a menu.
- **Themes:** light and dark both come from the same component; neither is an afterthought.

**How it is built**
- **Scoped tokens.**
  - Tokens are scoped to `.soft-glass` in `app/design-system.css`, so screens move over one at a time without touching the rest of the app.
  - Utilities are prefixed `sg-`: `bg-sg-*`, `text-sg-*`, plus `sg-glass`, `sg-glass-strong`, `sg-bar`, `sg-shadow-lg` and `sg-soft`.
- **Fonts.** Loaded with `next/font` in `lib/fonts.ts` and applied only on Soft Glass roots (`softGlassFonts`).
- **Components** in `components/soft-glass/`: `Mascot` and `UMark`, `AmbientLight`, `ScoreGauge`, `CoachBubble`, `ThemeSwitch`, `LandingMenu`.
- **Shared class strings** in `components/soft-glass/classes.ts`: `focusRing`, `coralButton`, `fieldInput`, `fieldLabel`, `fieldError`. Every screen gets the same focus ring, field and button.
- **Build order and file overlaps** are tracked in epic AIIN-123, one story per area.
  - **Update 2026-10-26:** every screen was designed and approved on the canvas first ([ADR](2026-10-25-design-first-on-the-canvas.md)).
    - Built, merged to `develop` and pushed: the landing page, auth, the app shell ([ADR](2026-10-25-app-shell-navigation.md)), Today, practice, the interview session and documents, the feedback report and the employer dashboard (AIIN-122, AIIN-124 to AIIN-130). The design-system follow-ups (focus ring, field border, `display-2xs`) went in with them (AIIN-142).
    - Still to build: resume, company prep, flashcards, the 90-day plan, profile and billing, progress and community, system states and admin (AIIN-131 to AIIN-138).
  - The uncommitted liquid-glass redesign was set aside on its own local branch (`feature/liquid-glass-redesign`), so it never mixed with this work.

The how-to for building a screen is in [`docs/design/soft-glass.md`](../design/soft-glass.md).

## Consequences

**Easier:** One look from the landing page to the last screen. Light and dark are tested together by design. New screens reuse the same components and class strings.

**Harder:**
- Two design languages coexist until the migration ends. Old styles are removed only at the end (AIIN-139).
- Soft Glass pages load two extra font families.
- Glass needs care for contrast. Floating bars use the more opaque `sg-bar`, form fields use `--sg-field-border`, and on tinted panels the score arc uses the deeper lavender (`arcClassName`).

**Lessons recorded while building the landing page:**
- The softness utility is `sg-soft`, not `font-soft`: `tailwind-merge` treats unknown `font-*` classes as a font family and silently drops `font-display`.
- Page roots use `overflow-x-clip`, not `overflow-hidden`: hidden creates a scroll container and breaks the sticky header.
- `@theme inline` values exist only inside utilities. Raw CSS must use `var(--font-jakarta)`, not `var(--font-body)`.
- Check that each container fits from 320px up, not just that the page has no horizontal scroll: the header once overflowed its own pill while the page looked fine.

**Lessons recorded while building the app screens (2026-10-25/26):**
- A server component must not import a non-component value (a constant, an array) from a `"use client"` module. It receives a client reference instead of the value, and the page crashes at runtime (`STATUS_FILTERS.includes is not a function`). Neither the type check nor the build catches it. Put shared constants in a plain module.
- Pages inside the app shell don't add their own `.soft-glass` root, fonts or `AmbientLight`: the layout provides them, and a nested root paints over the shell's light.
- Portals (dialogs) render outside the page's `.soft-glass` root, so each dialog panel brings its own (`components/interviews/sg-dialog.tsx`).

## Alternatives considered

- **A, B or C.** Rejected in review (see Context).
- **Finish the uncommitted liquid-glass redesign.** It continues the look the audit criticised, and the brief asked for a fresh start.
- **Swap the global tokens in one go.** One change would restyle every screen at once, including screens nobody has checked in the new look; scoping to `.soft-glass` lets each screen be checked as it moves.

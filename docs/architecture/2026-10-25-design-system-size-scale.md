# One size scale and brand tokens for the app interior
**Date:** 2026-10-25  
**Status:** Accepted — implemented, on `develop` since 2026-10-26 (AIIN-118, AIIN-119, AIIN-120; screen migration in `d970bc3`)  
**Deciders:** Vinay, Engineering

## Context

The UX audit (`docs/audits/2026-10-24-ux-design-audit.md`, 38/100) and day-to-day use found that sizes were picked screen by screen:

- 60px gradient page titles next to 10px labels.
- Card padding and gaps that varied on every screen.
- 200+ hardcoded emerald, cyan and teal classes standing in for a brand colour.

Some screens were dark-only and unreadable in light mode.

## Decision

1. **Named scale.** A named scale in `app/design-system.css` (Tailwind v4 `@theme`), used instead of ad-hoc sizes:

   | Scale | Values |
   |---|---|
   | Type | `text-page-title` 24/32 · `text-section-title` 18/28 · `text-card-title` 16/24 · `text-body` 14/20 · `text-caption` 12/16 (never smaller) · `text-metric` 30/36 |
   | Spacing | `gap-section` 32 · `gap-stack` 16 · `p-card` 24 |
   | Control height | `h-control-sm` 32 · `h-control` 36 · `h-control-lg` 40 |
   | Radius | `rounded-control` (buttons, inputs, chips) · `rounded-card` (cards, panels, dialogs) · `rounded-full` (avatars and pills only) |

2. **Brand tokens.** `bg-brand`, `text-brand`, `border-brand`, `bg-brand-subtle`, `text-brand-foreground`. Light mode uses a darker teal so it stays readable as text on white (about 5.4:1).
3. **Shared layout components.**
   - `PageHeader`, `Section` and `SectionHeader` in `components/layout/page-header.tsx`.
   - `StatCard` in `components/layout/stat-card.tsx`.
   - `StatusScreen` in `components/layout/status-screen.tsx`, which replaced nine hand-styled interview status screens.
4. **Migration.** Screens outside the liquid-glass redesign (uncommitted at the time, now parked on `feature/liquid-glass-redesign`) moved first. Off-scale sizes in those files went from 121 to 0:
   - career wizard
   - profile
   - interview entry page
   - flashcards
   - profile form
   - resume analysis

## Consequences

**Easier:** A new screen picks sizes by name, and changing the scale changes every screen that uses it. Light mode works on the migrated screens.

**Harder:** Two systems coexist until the old styles are retired: screens not yet on Soft Glass use this scale, and Soft Glass screens use their own tokens. The screens that were part of the liquid-glass redesign were never migrated to the scale; they are rebuilt in Soft Glass instead (AIIN-121, closed as superseded by AIIN-123).

**Relationship with Soft Glass.** [Soft Glass](2026-10-25-soft-glass-design-language.md) replaces the *look* (palette, fonts, surfaces). It does not replace the idea of a named scale.
- The landing and auth screens write their larger display sizes inline.
- The Soft Glass app interior (AIIN-125 onward) has started adding its sizes to this scale: `text-display-2xs` (22/28, weight 600) for card headings (AIIN-142). New Soft Glass sizes should go into the scale the same way rather than be written inline.
- The teal `--brand` tokens are retired with the old styles (AIIN-139) once no screen uses them.

## Alternatives considered

- **Use Tailwind's default scale directly.** It has every size, which is the problem: nothing says which one a page title should use.
- **Put the tokens in `globals.css`.** At the time that file held the uncommitted redesign; a separate `design-system.css` imported from it kept the two changes apart.

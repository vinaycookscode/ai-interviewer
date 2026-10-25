# Building a screen in Soft Glass

How to move a screen to Soft Glass, the product's design language. Why we chose it is in the [ADR](../architecture/2026-10-25-soft-glass-design-language.md). The approved designs (home, practice, interview session, feedback report, landing; light and dark) are on the [design canvas](https://claude.ai/artifact/Q1hFq3HP7UtDQ34dRQ17uQ). Progress is tracked in Kaam epic **AIIN-123**.

**Already in Soft Glass**
- Landing page: `app/page.tsx`
- Auth screens: `app/auth/*` (built, not yet verified, AIIN-124)

**Good references to copy from**
- Landing page: `app/page.tsx`
- Sign-in form: `components/auth/login-form.tsx`

## 1. The root

Soft Glass tokens only exist inside an element with the `soft-glass` class, so each screen opts in at its root:

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
| Form field edge | `border-sg-field-border` (use `fieldInput`) |
| Error, success | `text-sg-danger`, `text-sg-success` (+ `/10` backgrounds) |

**Type**
- Headings: `font-display sg-soft` (Fraunces with its soft axis). Body: Plus Jakarta Sans, the default inside `.soft-glass`.
- The softness utility is `sg-soft`, **not** `font-soft`. `cn()` (tailwind-merge) treats any unknown `font-*` class as a font family and silently drops `font-display`.

| Role | Size used today |
|---|---|
| Hero heading | 38px below 360px · 44 · 56 from `sm` · 62 from `lg` |
| Section heading | 32/38 · 44/50 from `sm` |
| Card heading (Fraunces) | 23/29 · 28/34 from `sm` |
| Auth card heading | 30/36 · 34/40 from `sm` |
| Body | 16/24 |

When the app interior moves over, add these sizes to the named scale in `app/design-system.css` instead of writing them inline (see the [size-scale ADR](../architecture/2026-10-25-design-system-size-scale.md)).

## 3. Components

| Component | File | Use it for |
|---|---|---|
| `Mascot`, `UMark` | `components/soft-glass/mascot.tsx` | U, the coach, with a face (tips, empty and error states, auth cards). `UMark` is the logo without expression. Decorative unless you pass `label`. |
| `AmbientLight` | `components/soft-glass/ambient-light.tsx` | The blurred coral and lavender light behind a screen. Once per page. |
| `ScoreGauge` | `components/soft-glass/score-gauge.tsx` | A half-ring score out of 10. On a tinted panel, pass `arcClassName="stroke-sg-lavender-ink"`: plain lavender is too faint there (about 2.5:1). |
| `CoachBubble` | `components/soft-glass/coach-bubble.tsx` | A tip from U: mascot plus speech bubble. |
| `ThemeSwitch` | `components/soft-glass/theme-switch.tsx` | Light/dark toggle (next-themes). |
| `LandingMenu` | `components/soft-glass/landing-menu.tsx` | The header menu below `lg`. Closes on link, Escape or a tap outside. Its panel is solid, not glass, so large text behind it doesn't bleed through. |

**Shared class strings** in `components/soft-glass/classes.ts`. Use these instead of writing your own:

| Export | What it is |
|---|---|
| `focusRing` | The lavender focus ring every interactive element uses |
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

## 6. Done means

Follow the checklist in [`docs/LOCAL_DEVELOPMENT.md` → Checking a UI change](../LOCAL_DEVELOPMENT.md#checking-a-ui-change) (light and dark; 320 to 1280px with nothing overflowing its own container; keyboard; console; type check). Then:

- Remove the old classes (liquid-glass, hardcoded emerald, cyan or teal) from the files you touched.
- Update the screen's story in Kaam, including how you checked it.

// Class strings shared by Soft Glass screens, so every focus ring, field and primary button matches.

/**
 * Keyboard focus ring: 2px solid sg-focus with a 2px gap (deep lavender in light, lavender in dark).
 * `outline-solid` is explicit so it still shows on elements whose base classes set `outline-none`.
 */
export const focusRing =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-sg-focus";

/** Coral call-to-action. Add a height and width at the call site. */
export const coralButton =
    "inline-flex items-center justify-center gap-2 rounded-full bg-sg-coral font-bold text-sg-coral-ink shadow-[0_16px_34px_-16px_var(--sg-coral)] transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 " +
    focusRing;

/** Overrides for the shadcn `Input`: 48px soft field, 16px text so iOS doesn't zoom on focus. Focus uses the shared ring. */
export const fieldInput =
    "h-12 rounded-2xl border-sg-field-border bg-sg-row px-4 text-base shadow-none md:text-base dark:bg-sg-row placeholder:text-sg-muted/60 focus-visible:border-sg-field-border focus-visible:ring-0 aria-invalid:border-sg-danger aria-invalid:ring-sg-danger/20 dark:aria-invalid:ring-sg-danger/30 " +
    focusRing;

export const fieldLabel = "text-sm font-semibold text-sg-text data-[error=true]:text-sg-danger";

export const fieldError = "text-[13px] font-semibold text-sg-danger";

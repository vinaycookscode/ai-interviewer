import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { softGlassFonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";

/**
 * Focus-mode root for practice and interview sessions: no app navigation,
 * just the session. Opts its subtree into Soft Glass.
 */
export function FocusRoot({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(softGlassFonts, "soft-glass relative min-h-screen overflow-x-clip text-base leading-6", className)}>
            <AmbientLight />
            <div className="relative flex min-h-screen flex-col gap-5 px-3 pb-7 pt-3 sm:px-7 sm:pt-5">{children}</div>
        </div>
    );
}

/** A centred card on the focus root, for the steps before and after a session. */
export function FocusCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className="flex flex-1 items-center justify-center py-6">
            <div
                className={cn(
                    "sg-glass sg-shadow-lg flex w-full max-w-lg flex-col gap-6 rounded-[24px] p-6 sm:rounded-[28px] sm:p-8",
                    className
                )}
            >
                {children}
            </div>
        </div>
    );
}

/** Small label above an inset row or panel. */
export const eyebrow = "text-[13px] font-bold leading-[18px] text-sg-muted";

/** Secondary pill button (outline). Add a height at the call site when it differs from 40px. */
export const outlineButton =
    "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-sg-field-border px-4 text-sm font-semibold text-sg-text transition-colors hover:bg-sg-chip disabled:pointer-events-none disabled:opacity-60 " +
    focusRing;

/** Ink button: the strong secondary action. */
export const inkButton =
    "inline-flex items-center justify-center gap-2 rounded-full bg-sg-ink font-bold text-sg-ink-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 " +
    focusRing;

interface SessionHeaderProps {
    title: string;
    subtitle?: string;
    /** Zero-based index of the current question. */
    current: number;
    total: number;
    /** Right-hand controls (proctoring chip, language, end). */
    children?: React.ReactNode;
}

/** The focus-mode bar: what this session is, where you are in it, and its controls. */
export function SessionHeader({ title, subtitle, current, total, children }: SessionHeaderProps) {
    return (
        <header className="sg-glass flex flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-[22px] py-2.5 pl-4 pr-3">
            <div className="flex min-w-0 items-center gap-3">
                <UMark />
                <div className="flex min-w-0 flex-col">
                    <span className="truncate font-bold">{title}</span>
                    {subtitle && <span className="truncate text-[13px] font-medium leading-[18px] text-sg-muted">{subtitle}</span>}
                </div>
            </div>
            {total > 0 && (
                <div className="flex items-center gap-3">
                    <span className="font-semibold">
                        Question {Math.min(current + 1, total)} of {total}
                    </span>
                    <ProgressDots current={current} total={total} />
                </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
                {children}
                <ThemeSwitch className="hidden sm:inline-flex" />
            </div>
        </header>
    );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
    // Long interviews would overflow the bar; the "Question n of m" text carries the count.
    if (total > 12) return null;
    return (
        <ol aria-hidden="true" className="flex gap-1">
            {Array.from({ length: total }, (_, i) => (
                <li
                    key={i}
                    className={cn(
                        "h-1.5 rounded-full",
                        i === current ? "w-[22px] bg-sg-ink" : "w-2.5",
                        i < current ? "bg-sg-coral" : i > current && "bg-sg-track"
                    )}
                />
            ))}
        </ol>
    );
}

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { FocusCard, FocusRoot } from "@/components/interview/session-shell";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { coralButton } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

const TONES = {
    neutral: "bg-sg-chip text-sg-text",
    error: "bg-sg-danger/10 text-sg-danger",
    success: "bg-sg-lavender-soft text-sg-lavender-ink",
} as const;

interface StatusScreenProps {
    title: string;
    icon?: LucideIcon;
    tone?: keyof typeof TONES;
    /** Explanation under the title. */
    children?: React.ReactNode;
    action?: { label: string; href: string };
}

const fallback = { label: "Go to your dashboard", href: "/dashboard" };

/**
 * Full-screen message for a state the user can't continue past (expired link,
 * not yet scheduled, sign-in needed…), with one next step: the given action, or the dashboard,
 * so no screen is a dead end (AIIN-137).
 * The icon always sits beside words, so the tone is never the only signal.
 */
export function StatusScreen({ title, icon: Icon, tone = "neutral", children, action = fallback }: StatusScreenProps) {
    return (
        <FocusRoot>
            <header className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2.5">
                    <UMark className="size-[30px]" />
                    <span className="sg-soft font-display text-lg font-semibold">Get Back To U</span>
                </span>
                <ThemeSwitch />
            </header>
            <FocusCard className="items-center text-center">
                {Icon && (
                    <span className={cn("flex size-12 items-center justify-center rounded-full", TONES[tone])} aria-hidden="true">
                        <Icon className="size-6" />
                    </span>
                )}
                <div className="flex flex-col gap-2">
                    <h1 className="sg-soft font-display text-[30px] font-semibold leading-9 tracking-[-0.02em] sm:text-[34px] sm:leading-10">{title}</h1>
                    {children && <div className="flex flex-col gap-2 text-base leading-6 text-sg-muted">{children}</div>}
                </div>
                <Link href={action.href} className={cn(coralButton, "h-12 w-full px-6 sm:w-auto")}>
                    {action.label}
                </Link>
            </FocusCard>
        </FocusRoot>
    );
}

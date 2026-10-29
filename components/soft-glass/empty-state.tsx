import { Mascot } from "@/components/soft-glass/mascot";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    children?: React.ReactNode;
    /** Replaces U, e.g. a search icon for "nothing matches". */
    icon?: React.ReactNode;
    /** The one next step: a link or button, styled at the call site. */
    action?: React.ReactNode;
    headingLevel?: "h2" | "h3";
    className?: string;
}

/** Nothing here yet: U (or an icon), what this space is for, and one next step (AIIN-137, AIIN-88). */
export function EmptyState({ title, children, icon, action, headingLevel = "h2", className }: EmptyStateProps) {
    const Heading = headingLevel;
    return (
        <section className={cn("sg-glass flex flex-col items-center gap-3 rounded-[24px] p-6 text-center sm:rounded-[28px] sm:p-8", className)}>
            {icon ?? <Mascot className="size-16" />}
            <Heading className="font-display sg-soft mt-2 text-[26px] leading-8 font-semibold tracking-[-0.015em] text-balance">{title}</Heading>
            {children && <p className="max-w-[360px] text-pretty text-sg-muted">{children}</p>}
            {action && <div className="mt-2">{action}</div>}
        </section>
    );
}

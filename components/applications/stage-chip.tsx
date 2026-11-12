import { Briefcase, CheckCircle2, Eye, Mic, PauseCircle, Send, X, XCircle, type LucideIcon } from "lucide-react";
import type { Stage } from "@/lib/applications";
import { cn } from "@/lib/utils";

const LOOK: Record<Stage, { icon: LucideIcon; tone: string }> = {
    INVITED: { icon: Send, tone: "bg-sg-lavender-soft text-sg-lavender-ink" },
    APPLIED: { icon: Send, tone: "bg-sg-chip text-sg-text" },
    SCREENING: { icon: Eye, tone: "bg-sg-lavender-soft text-sg-lavender-ink" },
    INTERVIEW: { icon: Mic, tone: "bg-sg-lavender-soft text-sg-lavender-ink" },
    OFFER: { icon: Briefcase, tone: "bg-sg-chip text-sg-text" },
    HIRED: { icon: CheckCircle2, tone: "bg-sg-chip text-sg-success" },
    REJECTED: { icon: XCircle, tone: "bg-sg-chip text-sg-danger" },
    WITHDRAWN: { icon: X, tone: "bg-sg-chip text-sg-muted" },
    DECLINED: { icon: X, tone: "bg-sg-chip text-sg-muted" },
};

const chip = "inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap";

/** A stage as icon and word, never colour alone (AIIN-195). Server-safe: the label comes from the caller. */
export function StageChip({ stage, label, className }: { stage: Stage; label: string; className?: string }) {
    const { icon: Icon, tone } = LOOK[stage];
    return (
        <span className={cn(chip, tone, className)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}

export function HoldChip({ label }: { label: string }) {
    return (
        <span className={cn(chip, "bg-sg-chip text-sg-text")}>
            <PauseCircle className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}

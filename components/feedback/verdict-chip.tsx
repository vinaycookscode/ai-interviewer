import { CircleCheck, CircleDashed, Eye, OctagonAlert, ShieldCheck } from "lucide-react";
import type { IntegrityReviewOutcome, IntegrityVerdict } from "@prisma/client";
import { cn } from "@/lib/utils";

// The same icons and tones as the integrity section on the report (AIIN-177): told by icon and word, never colour alone.
const STYLE = {
    NO_CONCERNS: { icon: ShieldCheck, chip: "bg-sg-chip text-sg-muted" },
    WORTH_A_LOOK: { icon: Eye, chip: "bg-sg-lavender-soft text-sg-lavender-ink" },
    STRONG_CONCERNS: { icon: OctagonAlert, chip: "bg-sg-danger/10 text-sg-danger" },
    none: { icon: CircleDashed, chip: "bg-sg-chip text-sg-muted" },
    // After the employer's review (AIIN-179)
    NO_ISSUE: { icon: CircleCheck, chip: "bg-sg-chip text-sg-text" },
    CONFIRMED: { icon: OctagonAlert, chip: "bg-sg-danger/10 text-sg-danger" },
} satisfies Record<IntegrityVerdict | IntegrityReviewOutcome | "none", unknown>;

/**
 * An interview's integrity verdict as a chip, for the ranked list (AIIN-178), or the employer's review of it once
 * reviewed (AIIN-179). `label` is already translated.
 */
export function VerdictChip({
    verdict,
    review = null,
    label,
    className,
}: {
    verdict: IntegrityVerdict | null;
    review?: IntegrityReviewOutcome | null;
    label: string;
    className?: string;
}) {
    const { icon: Icon, chip } = STYLE[review ?? verdict ?? "none"];
    return (
        <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold whitespace-nowrap", chip, className)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}

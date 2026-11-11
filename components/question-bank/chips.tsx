import { CircleAlert, CircleCheck, Mic, NotebookText, PencilLine, RefreshCw, Sparkles, Video, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Chips from the approved Question Bank artboards (AIIN-207): status and source are told by icon and word.
export const bankChip = "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-sg-chip px-2.5 text-[13px] font-bold";

const STATUS: Record<string, { icon: LucideIcon; tone: string }> = {
    NEW: { icon: CircleAlert, tone: "" },
    PRACTISING: { icon: RefreshCw, tone: "bg-sg-lavender-soft text-sg-lavender-ink" },
    CONFIDENT: { icon: CircleCheck, tone: "text-sg-success" },
};

const SOURCE: Record<string, LucideIcon> = {
    MOCK: Mic,
    INTERVIEW: Video,
    COMPANY_PREP: NotebookText,
    SELF_ADDED: PencilLine,
    RECOMMENDED: Sparkles,
};

export function StatusChip({ status, label }: { status: string; label: string }) {
    const { icon: Icon, tone } = STATUS[status] ?? STATUS.NEW;
    return (
        <span className={cn(bankChip, tone)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}

export function SourceChip({ source, label }: { source: string; label: string }) {
    const Icon = SOURCE[source] ?? Mic;
    return (
        <span className={bankChip}>
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}

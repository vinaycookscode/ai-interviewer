import { Archive, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/** A problem's status, by icon and word (AIIN-107). */
export function StatusChip({ status, label }: { status: string; label: string }) {
    const Icon = status === "PUBLISHED" ? Check : status === "ARCHIVED" ? Archive : Clock;
    return (
        <span
            className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold whitespace-nowrap",
                status === "PUBLISHED" && "bg-sg-chip",
                status === "DRAFT" && "bg-sg-lavender-soft text-sg-lavender-ink",
                status === "ARCHIVED" && "border border-dashed border-sg-field-border text-sg-muted"
            )}
        >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}

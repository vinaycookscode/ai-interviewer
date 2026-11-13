import { CalendarClock, Lock, PencilLine, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DriveStatus } from "@/lib/drives";

const LOOK: Record<DriveStatus, { icon: typeof Radio; tone: string }> = {
    DRAFT: { icon: PencilLine, tone: "bg-sg-chip text-sg-text" },
    SCHEDULED: { icon: CalendarClock, tone: "bg-sg-lavender-soft text-sg-lavender-ink" },
    LIVE: { icon: Radio, tone: "bg-sg-chip text-sg-success" },
    CLOSED: { icon: Lock, tone: "bg-sg-chip text-sg-muted" },
};

/** A drive's status, told by icon and word (AIIN-165). */
export function DriveStatusChip({ status, label }: { status: DriveStatus; label: string }) {
    const { icon: Icon, tone } = LOOK[status];
    return (
        <span className={cn("inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap", tone)}>
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
        </span>
    );
}

/** Dates in India time, the way drives are set and read: "18 Nov, 9:00 am". */
export const istShort = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

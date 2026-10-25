import { Mascot } from "@/components/soft-glass/mascot";
import { cn } from "@/lib/utils";

interface CoachBubbleProps {
    children: React.ReactNode;
    className?: string;
    mascotClassName?: string;
}

/** A tip from U: the mascot with a speech bubble beside it. */
export function CoachBubble({ children, className, mascotClassName }: CoachBubbleProps) {
    return (
        <div className={cn("flex items-start gap-3", className)}>
            <Mascot className={cn("size-11", mascotClassName)} />
            <div className="sg-glass-strong min-w-0 flex-1 rounded-[6px_20px_20px_20px] px-4 py-3.5">{children}</div>
        </div>
    );
}

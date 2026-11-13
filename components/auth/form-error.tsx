import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";

interface FormErrorProps {
    message?: string;
    /** Red when the person can fix it; lavender when it's on our side or a wait (AIIN-57). */
    tone?: "danger" | "calm";
    /** The next step, e.g. "Reset your password". */
    action?: { label: string; href: string };
}

export const FormError = ({ message, tone = "danger", action }: FormErrorProps) => {
    if (!message) return null;

    return (
        <div
            role="alert"
            className={cn(
                "flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold",
                tone === "danger" ? "bg-sg-danger/10 text-sg-danger" : "bg-sg-lavender-soft text-sg-lavender-ink",
            )}
        >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-1.5">
                <p>{message}</p>
                {action && (
                    <Link href={action.href} className={cn("self-start rounded underline underline-offset-4", focusRing)}>
                        {action.label}
                    </Link>
                )}
            </div>
        </div>
    );
};

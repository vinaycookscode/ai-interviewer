"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { enrollInProgram } from "@/actions/placement-program";

interface EnrollButtonProps {
    programId: string;
    slug: string;
    label: string;
    busyLabel: string;
    failedLabel: string;
    className: string;
}

/** Starts a plan and opens its first day. */
export function EnrollButton({ programId, slug, label, busyLabel, failedLabel, className }: EnrollButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const enroll = () =>
        startTransition(async () => {
            const result = await enrollInProgram(programId);
            if ("error" in result && result.error && result.error !== "Already enrolled in this program") {
                toast.error(failedLabel);
                return;
            }
            router.push(`/candidate/placement-program/${slug}`);
        });

    return (
        <button type="button" onClick={enroll} disabled={isPending} className={className}>
            {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isPending ? busyLabel : label}
        </button>
    );
}

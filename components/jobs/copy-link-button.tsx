"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";
import { outlineButton } from "@/components/jobs/employer-ui";

interface CopyLinkButtonProps {
    interviewId: string;
    token: string;
    candidateName: string;
    /** "row" is the quiet table action; "card" is the bordered phone button. */
    variant?: "row" | "card";
}

/** Copies one candidate's own interview link (`/interview/{id}?token=…`). */
export function CopyLinkButton({ interviewId, token, candidateName, variant = "row" }: CopyLinkButtonProps) {
    const t = useTranslations("Employer.candidates");
    const [copied, setCopied] = useState(false);

    async function copy() {
        const link = `${window.location.origin}/interview/${interviewId}?token=${token}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            toast.success(t("linkCopied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(t("linkCopyFailed"));
        }
    }

    const Icon = copied ? Check : Copy;

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={t("copyLinkAria", { name: candidateName })}
            className={
                variant === "card"
                    ? cn(outlineButton, "h-10 self-start text-sm")
                    : cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-bold whitespace-nowrap hover:bg-sg-chip",
                          focusRing
                      )
            }
        >
            <Icon className="size-4" aria-hidden="true" />
            {copied ? t("copied") : variant === "card" ? t("copyTheirLink") : t("copyLink")}
        </button>
    );
}

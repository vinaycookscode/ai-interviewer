"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { resendVerification } from "@/actions/verify-email";
import { cn } from "@/lib/utils";

/** "Send it again" / "Send a new link" (AIIN-55). */
export function ResendVerification({ label, className }: { label: string; className: string }) {
    const t = useTranslations("VerifyEmail");
    const [state, setState] = useState<"idle" | "sent" | "limit" | "failed">("idle");
    const [isPending, startTransition] = useTransition();
    return (
        <>
            <button
                type="button"
                disabled={isPending || state === "sent"}
                onClick={() =>
                    startTransition(async () => {
                        const r = await resendVerification().catch(() => ({ error: "failed" as const }));
                        setState("ok" in r || r.error === "verified" ? "sent" : r.error === "limit" ? "limit" : "failed");
                    })
                }
                className={className}
            >
                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {state === "sent" ? t("sent") : label}
            </button>
            <p role="status" className={cn("text-center text-sm font-semibold text-sg-danger", state !== "limit" && state !== "failed" && "sr-only")}>
                {state === "limit" ? t("limit") : state === "failed" ? t("failed") : state === "sent" ? t("sent") : ""}
            </p>
        </>
    );
}

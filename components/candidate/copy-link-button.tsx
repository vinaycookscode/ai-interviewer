"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies the page's address, then says so in place (AIIN-102). */
export function CopyLinkButton({ label, copiedLabel, failedLabel, className }: { label: string; copiedLabel: string; failedLabel: string; className?: string }) {
    const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
    const Icon = state === "copied" ? Check : Copy;
    return (
        <button
            type="button"
            className={className}
            onClick={() =>
                navigator.clipboard.writeText(window.location.href).then(
                    () => setState("copied"),
                    () => setState("failed")
                )
            }
        >
            <Icon className="size-[18px]" aria-hidden="true" />
            <span aria-live="polite">{state === "copied" ? copiedLabel : state === "failed" ? failedLabel : label}</span>
        </button>
    );
}

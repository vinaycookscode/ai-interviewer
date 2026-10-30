"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toggleFeatureFlag } from "@/actions/feature-flags";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

/** A feature's on/off switch for everyone, told by position and word (AIIN-138). */
export function GlobalFeatureToggle({ featureKey, name, initialValue }: { featureKey: string; name: string; initialValue: boolean }) {
    const t = useTranslations("Admin.features");
    const router = useRouter();
    const [on, setOn] = useState(initialValue);
    const [pending, startTransition] = useTransition();

    const flip = () => {
        const next = !on;
        setOn(next);
        startTransition(async () => {
            try {
                await toggleFeatureFlag(featureKey, next);
                toast.success(t("updated", { name, state: next ? t("on").toLowerCase() : t("off").toLowerCase() }));
                router.refresh();
            } catch {
                setOn(!next);
                toast.error(t("failed", { name }));
            }
        });
    };

    return (
        <span className="flex items-center gap-2.5">
            <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={name}
                onClick={flip}
                disabled={pending}
                className={cn("flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors disabled:opacity-60", on ? "justify-end bg-sg-ink" : "justify-start bg-sg-field-border", focusRing)}
            >
                <span aria-hidden="true" className={cn("size-[26px] rounded-full", on ? "bg-sg-ink-foreground" : "bg-sg-bg")} />
            </button>
            <span className="min-w-7 text-sm font-bold">{on ? t("on") : t("off")}</span>
        </span>
    );
}

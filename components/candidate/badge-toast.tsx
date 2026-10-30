"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { takeNewBadges } from "@/actions/achievements";
import { FOCUS_ROUTE } from "@/components/soft-glass/app-shell";
import { BadgeIcon } from "@/components/candidate/badge-icon";
import { focusRing } from "@/components/soft-glass/classes";
import type { AchievementKey } from "@/lib/achievements/rules";
import { cn } from "@/lib/utils";

/** "New badge: …" on the first page the candidate opens after earning one (AIIN-102). Not during a focus session. */
export function BadgeToast() {
    const t = useTranslations("Badges");
    const pathname = usePathname();
    const [badges, setBadges] = useState<AchievementKey[]>([]);
    const focus = FOCUS_ROUTE.test(pathname);

    useEffect(() => {
        if (focus) return;
        // Each badge comes back once, so a repeated call (Strict Mode) only ever adds
        takeNewBadges()
            .then((keys) => keys.length && setBadges((shown) => [...new Set([...shown, ...keys])]))
            .catch(() => {});
    }, [pathname, focus]);

    if (focus || !badges.length) return null;
    const one = badges.length === 1;
    const names = badges.map((key) => t(`items.${key}.name`));

    return (
        <div
            role="status"
            className="sg-glass-strong sg-shadow-lg fixed top-20 right-3 left-3 z-50 ml-auto flex max-w-[360px] items-center gap-3 rounded-[20px] py-3.5 pr-2 pl-4 sm:top-24 sm:right-8"
        >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sg-coral text-sg-coral-ink">
                <BadgeIcon badge={one ? badges[0] : null} className="size-[22px]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <strong>{one ? t("toastOne", { name: names[0] }) : t("toastMany", { count: badges.length })}</strong>
                <span className="text-sm text-sg-muted">
                    {one ? t(`items.${badges[0]}.earned`) : new Intl.ListFormat("en", { type: "conjunction" }).format(names)}
                </span>
            </span>
            <button
                type="button"
                aria-label={t("close")}
                onClick={() => setBadges([])}
                className={cn("flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-sg-chip", focusRing)}
            >
                <X className="size-4" aria-hidden="true" />
            </button>
        </div>
    );
}

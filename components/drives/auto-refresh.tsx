"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";

/** Refreshes the drive's numbers every 30 seconds while it's live, without reloading the page (AIIN-172 AC4). */
export function AutoRefresh({ live, at }: { live: boolean; at: string }) {
    const t = useTranslations("Drives");
    const router = useRouter();
    // Starts at the server's time so the first render matches the server's HTML, then follows the clock
    const [now, setNow] = useState(() => new Date(at).getTime());
    useEffect(() => {
        setNow(Date.now());
        const tick = setInterval(() => setNow(Date.now()), 5_000);
        const refresh = live ? setInterval(() => router.refresh(), 30_000) : undefined;
        return () => {
            clearInterval(tick);
            if (refresh) clearInterval(refresh);
        };
    }, [live, router]);
    const seconds = Math.max(0, Math.round((now - new Date(at).getTime()) / 1000));
    return (
        <p className="inline-flex items-center gap-1.5 text-[13px] text-sg-muted">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            {t("updated", { seconds })}
            {live ? ` · ${t("refreshes")}` : ""}
        </p>
    );
}

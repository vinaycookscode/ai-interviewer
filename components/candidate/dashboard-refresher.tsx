"use client";

import { useRouter } from "next/navigation";
import { useVisibilityPolling } from "@/lib/use-visibility-polling";
import { POLLING_INTERVALS } from "@/lib/polling-config";

/**
 * Refreshes the dashboard while something on it can still change by itself:
 * an interview in progress, or one waiting for its score (AIIN-81).
 * The page was just rendered, so it doesn't refresh on mount. Pauses when the tab is hidden.
 */
export function DashboardRefresher({ active }: { active: boolean }) {
    const router = useRouter();

    useVisibilityPolling(() => {
        router.refresh();
    }, POLLING_INTERVALS.DASHBOARD_REFRESH, active, false);

    return null; // This component renders nothing
}

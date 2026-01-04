"use client";

import { useRouter } from "next/navigation";
import { useVisibilityPolling } from "@/lib/use-visibility-polling";
import { POLLING_INTERVALS } from "@/lib/polling-config";

/**
 * Periodically refreshes dashboard data
 * Uses visibility-aware polling to reduce load when tab is hidden
 */
export function DashboardRefresher() {
    const router = useRouter();

    // Visibility-aware polling - pauses when tab is hidden
    useVisibilityPolling(() => {
        router.refresh();
    }, POLLING_INTERVALS.DASHBOARD_REFRESH);

    return null; // This component renders nothing
}

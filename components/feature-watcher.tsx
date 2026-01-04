"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLatestFlagUpdate } from "@/actions/feature-flags";
import { useVisibilityPolling } from "@/lib/use-visibility-polling";
import { POLLING_INTERVALS } from "@/lib/polling-config";

/**
 * Watches for feature flag updates and refreshes the page when changes are detected
 * Uses visibility-aware polling to reduce load when tab is hidden
 */
export function FeatureWatcher() {
    const router = useRouter();
    const lastUpdateRef = useRef<number>(0);

    // Initial fetch to set baseline
    useEffect(() => {
        getLatestFlagUpdate().then((ts) => {
            lastUpdateRef.current = ts;
        });
    }, []);

    // Visibility-aware polling - pauses when tab is hidden
    useVisibilityPolling(async () => {
        const latest = await getLatestFlagUpdate();
        const prev = lastUpdateRef.current;

        // If timestamp changed and we had a previous value, refresh
        if (prev > 0 && latest > prev) {
            router.refresh();
        }

        lastUpdateRef.current = latest;
    }, POLLING_INTERVALS.FEATURE_FLAGS);

    return null; // Invisible component
}

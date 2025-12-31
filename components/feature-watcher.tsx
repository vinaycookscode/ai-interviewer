"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getLatestFlagUpdate } from "@/actions/feature-flags";

export function FeatureWatcher() {
    const router = useRouter();
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        // Initial fetch to set baseline
        getLatestFlagUpdate().then((ts) => {
            lastUpdateRef.current = ts;
        });

        const interval = setInterval(async () => {
            const latest = await getLatestFlagUpdate();
            const prev = lastUpdateRef.current;

            // If timestamp changed and we had a previous value, refresh
            if (prev > 0 && latest > prev) {
                console.log("Feature flag update detected, refreshing...");
                router.refresh();
            }

            lastUpdateRef.current = latest;
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [router]);

    return null; // Invisible component
}

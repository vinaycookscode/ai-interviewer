"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackVisit } from "@/actions/analytics";

/** Counts a page view on every route change, not only the first load (AIIN-82). */
export function AnalyticsTracker() {
    const pathname = usePathname();
    useEffect(() => {
        trackVisit();
    }, [pathname]);

    return null;
}

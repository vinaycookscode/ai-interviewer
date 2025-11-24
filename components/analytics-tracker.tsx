"use client";

import { useEffect } from "react";
import { trackVisit } from "@/actions/analytics";

export function AnalyticsTracker() {
    useEffect(() => {
        trackVisit();
    }, []);

    return null;
}

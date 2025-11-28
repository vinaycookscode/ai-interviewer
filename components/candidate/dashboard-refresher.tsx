"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DashboardRefresher() {
    const router = useRouter();

    useEffect(() => {
        // Refresh the page data every 5 seconds
        const interval = setInterval(() => {
            router.refresh();
        }, 5000);

        return () => clearInterval(interval);
    }, [router]);

    return null; // This component renders nothing
}

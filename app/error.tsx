"use client";

import { ErrorCard } from "@/components/ui/error-card";
import { useEffect } from "react";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <ErrorCard
            retry={reset}
            description={error.message || "Something went wrong inside the application."}
        />
    );
}

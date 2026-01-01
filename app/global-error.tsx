"use client";

import { ErrorCard } from "@/components/ui/error-card";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <ErrorCard
                    title="Critical System Error"
                    description="Our servers encountered a critical issue. We have been notified."
                    retry={reset}
                />
            </body>
        </html>
    );
}

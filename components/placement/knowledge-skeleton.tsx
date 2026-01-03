"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for the Daily Knowledge Panel
 * Matches the layout of DailyKnowledgePanel for smooth loading transitions
 */
export function KnowledgeSkeleton() {
    return (
        <div className="space-y-6 h-full flex flex-col animate-pulse">
            {/* Header Skeleton */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 space-y-6">
                {/* Concept Explanation */}
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Key Takeaways */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex gap-3 p-3 bg-card border rounded-lg">
                                <Skeleton className="h-4 w-4 shrink-0" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Real World Use Cases */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                    <div className="grid gap-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-4 p-3 bg-muted/30 border rounded-lg">
                                <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/3" />
                                    <Skeleton className="h-3 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

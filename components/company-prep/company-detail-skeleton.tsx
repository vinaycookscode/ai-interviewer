"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for Company Detail Page
 * Matches the layout of the company detail page for smooth loading transitions
 */
export function CompanyDetailSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Back Link */}
            <Skeleton className="h-4 w-32" />

            {/* Header */}
            <div className="flex items-start gap-6">
                <Skeleton className="w-20 h-20 rounded-2xl" />
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full max-w-md" />
                    <div className="flex gap-4 mt-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px] gap-6">
                {/* Knowledge Panel Skeleton */}
                <div className="order-2 lg:order-1 bg-card border rounded-xl p-6 min-h-[400px]">
                    <div className="space-y-6">
                        <div>
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-7 w-48" />
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                        <div>
                            <Skeleton className="h-5 w-32 mb-3" />
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} className="h-8 w-24 rounded-full" />
                                ))}
                            </div>
                        </div>
                        <div>
                            <Skeleton className="h-5 w-28 mb-3" />
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => (
                                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Panel Skeleton */}
                <div className="order-1 lg:order-2 space-y-6">
                    {/* Interview Process */}
                    <div className="bg-card border rounded-xl p-6">
                        <Skeleton className="h-6 w-40 mb-4" />
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="bg-card border rounded-xl p-6">
                        <Skeleton className="h-6 w-36 mb-4" />
                        <div className="flex gap-4 mb-6">
                            <Skeleton className="h-10 flex-1 rounded-lg" />
                            <Skeleton className="h-10 w-28 rounded-lg" />
                            <Skeleton className="h-10 w-32 rounded-lg" />
                        </div>
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="border rounded-lg p-4">
                                    <Skeleton className="h-5 w-full mb-2" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-5 w-16 rounded" />
                                        <Skeleton className="h-5 w-16 rounded" />
                                        <Skeleton className="h-5 w-20 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton for company list page
 */
export function CompanyListSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header */}
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>

            {/* Search */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-card border rounded-xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <Skeleton className="w-14 h-14 rounded-xl" />
                            <div className="flex-1">
                                <Skeleton className="h-6 w-32 mb-2" />
                                <Skeleton className="h-5 w-16 rounded" />
                            </div>
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-4" />
                        <div className="flex gap-4">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

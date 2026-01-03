"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader for the Task List
 * Shows placeholder cards while tasks are loading
 */
export function TaskListSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-card border rounded-xl"
                >
                    {/* Checkbox area */}
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                        <Skeleton className="h-5 w-3/4" />
                    </div>

                    {/* Action button */}
                    <Skeleton className="h-9 w-20 rounded-lg shrink-0" />
                </div>
            ))}
        </div>
    );
}

/**
 * Full dashboard skeleton for initial page load
 */
export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-start justify-between">
                <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Skeleton className="h-10 w-24 rounded-lg" />
            </div>

            {/* Progress & Streak Row */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-card border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full rounded-full mb-4" />
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <Skeleton className="h-16 w-16 rounded-full mx-auto mb-3" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                {/* Knowledge Panel Skeleton */}
                <div className="order-2 lg:order-1 bg-card border rounded-xl p-6 min-h-[400px]">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>

                {/* Tasks Skeleton */}
                <div className="order-1 lg:order-2 bg-card border rounded-xl p-6">
                    <Skeleton className="h-6 w-32 mb-6" />
                    <TaskListSkeleton />
                </div>
            </div>
        </div>
    );
}

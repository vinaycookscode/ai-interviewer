"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DataCardProps {
    /** Icon component from lucide-react */
    icon?: LucideIcon;
    /** Card title */
    title: string;
    /** Main value to display (large text) */
    value?: string | number;
    /** Description or subtitle below the value */
    description?: string;
    /** Gradient class for background effect */
    gradient?: string;
    /** Icon color class (e.g., "text-blue-500") */
    iconColor?: string;
    /** Additional content in the card body */
    children?: React.ReactNode;
    /** Additional className for the card */
    className?: string;
    /** Click handler for interactive cards */
    onClick?: () => void;
}

/**
 * Reusable data card component for displaying metrics and information.
 * Reduces duplication across analytics, flashcards, and other data displays.
 *
 * @example
 * ```tsx
 * <DataCard
 *   icon={TrendingUp}
 *   title="Total Interviews"
 *   value={42}
 *   description="+12% from last month"
 *   iconColor="text-green-500"
 * />
 * ```
 */
export function DataCard({
    icon: Icon,
    title,
    value,
    description,
    gradient,
    iconColor = "text-primary",
    children,
    className,
    onClick,
}: DataCardProps) {
    const isClickable = !!onClick;

    return (
        <Card
            className={cn(
                "relative overflow-hidden transition-all",
                isClickable && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
                className
            )}
            onClick={onClick}
        >
            {/* Optional gradient background */}
            {gradient && (
                <div
                    className={cn(
                        "absolute inset-0 opacity-10 pointer-events-none",
                        gradient
                    )}
                />
            )}

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && <Icon className={cn("h-5 w-5", iconColor)} />}
            </CardHeader>

            <CardContent>
                {value !== undefined && (
                    <div className="text-2xl font-bold">{value}</div>
                )}
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
                {children}
            </CardContent>
        </Card>
    );
}

/**
 * Compact variant for smaller data displays
 */
interface CompactDataCardProps {
    icon?: LucideIcon;
    label: string;
    value: string | number;
    iconColor?: string;
    className?: string;
}

export function CompactDataCard({
    icon: Icon,
    label,
    value,
    iconColor = "text-muted-foreground",
    className,
}: CompactDataCardProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg bg-muted/50",
                className
            )}
        >
            {Icon && <Icon className={cn("h-4 w-4 shrink-0", iconColor)} />}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{label}</p>
                <p className="text-sm font-medium truncate">{value}</p>
            </div>
        </div>
    );
}

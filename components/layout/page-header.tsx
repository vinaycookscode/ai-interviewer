import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    /** Page title */
    title: string;
    /** Page description/subtitle */
    subtitle?: string;
    /** Optional badge next to title */
    badge?: {
        icon?: LucideIcon;
        text: string;
        variant?: "default" | "secondary" | "destructive" | "outline";
    };
    /** Actions to display on the right side */
    actions?: React.ReactNode;
    /** Additional className */
    className?: string;
    /** Breadcrumb content above the title */
    breadcrumb?: React.ReactNode;
}

/**
 * Consistent page header component for all dashboard pages.
 * Provides unified styling for page titles, subtitles, badges, and actions.
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="My Interviews"
 *   subtitle="View your interview invitations and results"
 *   badge={{ icon: Sparkles, text: "Pro Feature" }}
 *   actions={<Button>New Interview</Button>}
 * />
 * ```
 */
export function PageHeader({
    title,
    subtitle,
    badge,
    actions,
    className,
    breadcrumb,
}: PageHeaderProps) {
    const BadgeIcon = badge?.icon;

    return (
        <div className={cn("mb-8", className)}>
            {breadcrumb && <div className="mb-4">{breadcrumb}</div>}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {title}
                        </h1>
                        {badge && (
                            <Badge variant={badge.variant || "secondary"} className="gap-1">
                                {BadgeIcon && <BadgeIcon className="h-3 w-3" />}
                                {badge.text}
                            </Badge>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-muted-foreground">{subtitle}</p>
                    )}
                </div>

                {actions && (
                    <div className="flex items-center gap-2 shrink-0">{actions}</div>
                )}
            </div>
        </div>
    );
}

/**
 * Section header for dividing content within a page
 */
interface SectionHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

export function SectionHeader({
    title,
    description,
    actions,
    className,
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4",
                className
            )}
        >
            <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}

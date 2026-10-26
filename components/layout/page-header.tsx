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
 * The one title block per screen. Carries no outer margin: lay screens out
 * with `space-y-section` so every page spaces its header the same way.
 *
 * @example
 * ```tsx
 * <div className="space-y-section">
 *   <PageHeader
 *     title="My Interviews"
 *     subtitle="View your interview invitations and results"
 *     actions={<Button>New Interview</Button>}
 *   />
 *   <Section title="Upcoming">…</Section>
 * </div>
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
        <header className={cn("space-y-stack", className)}>
            {breadcrumb && <div>{breadcrumb}</div>}

            <div className="flex flex-col gap-stack sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-page-title">{title}</h1>
                        {badge && (
                            <Badge variant={badge.variant || "secondary"} className="gap-1">
                                {BadgeIcon && <BadgeIcon className="size-3" />}
                                {badge.text}
                            </Badge>
                        )}
                    </div>
                    {subtitle && <p className="text-body text-muted-foreground">{subtitle}</p>}
                </div>

                {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
        </header>
    );
}

interface SectionHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

/** Heading row for a section; prefer `Section`, which also spaces its content. */
export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between", className)}>
            <div className="min-w-0 space-y-0.5">
                <h2 className="text-section-title">{title}</h2>
                {description && <p className="text-body text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
    );
}

interface SectionProps extends Partial<Omit<SectionHeaderProps, "className">> {
    children: React.ReactNode;
    className?: string;
}

/** A titled block of a screen, with the standard gap between heading and content. */
export function Section({ title, description, actions, children, className }: SectionProps) {
    return (
        <section className={cn("space-y-stack", className)}>
            {title && <SectionHeader title={title} description={description} actions={actions} />}
            {children}
        </section>
    );
}

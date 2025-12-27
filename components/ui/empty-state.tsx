import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    actionLabel,
    actionHref,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/20 animate-in fade-in zoom-in duration-500",
            className
        )}>
            {Icon && (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted shadow-sm mb-6">
                    <Icon className="h-10 w-10 text-muted-foreground" />
                </div>
            )}
            <h3 className="text-xl font-semibold tracking-tight mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6 leading-relaxed">
                {description}
            </p>
            {actionLabel && (
                actionHref ? (
                    <Link href={actionHref}>
                        <Button size="lg" className="shadow-md hover:shadow-lg transition-all">
                            {actionLabel}
                        </Button>
                    </Link>
                ) : (
                    <Button
                        onClick={onAction}
                        size="lg"
                        className="shadow-md hover:shadow-lg transition-all"
                    >
                        {actionLabel}
                    </Button>
                )
            )}
        </div>
    );
}

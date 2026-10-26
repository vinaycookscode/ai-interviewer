import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    label: string;
    value: React.ReactNode;
    icon?: LucideIcon;
    className?: string;
}

/** One KPI: a small label above a `text-metric` number. */
export function StatCard({ label, value, icon: Icon, className }: StatCardProps) {
    return (
        <div className={cn("rounded-card border bg-card p-4 text-card-foreground", className)}>
            <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                {Icon && <Icon className="size-3.5" />}
                {label}
            </div>
            <div className="mt-1 text-metric tabular-nums">{value}</div>
        </div>
    );
}

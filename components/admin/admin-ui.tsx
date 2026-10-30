// Small Soft Glass pieces shared by the admin console's pages (AIIN-138). A plain module: server and client pages use it.
import { cn } from "@/lib/utils";

export function AdminHeading({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-[680px] min-w-0 flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{title}</h1>
                {description && <p className="text-lg text-sg-muted">{description}</p>}
            </div>
            {action}
        </div>
    );
}

export function StatTile({ value, label, note }: { value: React.ReactNode; label: string; note?: React.ReactNode }) {
    return (
        <li className="sg-glass flex flex-col gap-0.5 rounded-[24px] p-5">
            <span className="flex flex-col">
                <span className="font-display sg-soft text-[28px] leading-8 font-semibold">{value}</span>
                <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{label}</span>
            </span>
            {note && <span className="text-[13px] text-sg-muted">{note}</span>}
        </li>
    );
}

export const statGrid = "grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4";
export const th = "px-3 py-2.5 text-left text-[13px] font-bold whitespace-nowrap text-sg-muted";
export const td = "p-3 text-left";
export const tr = "border-t border-sg-rule";
export const chip = "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold whitespace-nowrap";

/** A pill that filters a list: pressed is filled in ink. */
export const filterPill = (on: boolean) =>
    cn(
        "inline-flex h-10 items-center rounded-full border-2 px-4 text-sm font-semibold",
        on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text hover:bg-sg-chip"
    );

export function RoleChip({ role, label }: { role: string; label: string }) {
    return <span className={cn(chip, role === "EMPLOYER" ? "bg-sg-ink text-sg-ink-foreground" : role === "ADMIN" ? "bg-sg-lavender-soft text-sg-lavender-ink" : "bg-sg-chip")}>{label}</span>;
}

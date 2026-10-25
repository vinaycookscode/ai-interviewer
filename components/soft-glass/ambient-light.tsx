import { cn } from "@/lib/utils";

/**
 * The soft coral and lavender light behind Soft Glass surfaces. Place it as
 * the first child of a `relative` container; it never captures pointer events.
 */
export function AmbientLight({ className }: { className?: string }) {
    return (
        <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
            <div className="absolute -left-40 -top-56 size-[42rem] rounded-full bg-[var(--sg-blob-a)] blur-[110px]" />
            <div className="absolute -right-56 top-20 size-[44rem] rounded-full bg-[var(--sg-blob-b)] blur-[120px]" />
            <div className="absolute left-1/4 top-[120rem] h-[38rem] w-[48rem] rounded-full bg-[var(--sg-blob-c)] blur-[130px]" />
        </div>
    );
}

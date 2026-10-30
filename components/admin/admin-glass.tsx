import { softGlassFonts } from "@/lib/fonts";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { cn } from "@/lib/utils";

/**
 * A Soft Glass page inside the current admin layout (AIIN-107), until the console itself moves to Soft Glass
 * (AIIN-138). Fills the layout's padded main area.
 */
export function AdminGlass({ children }: { children: React.ReactNode }) {
    return (
        <div className={cn(softGlassFonts, "soft-glass relative -m-8 min-h-[calc(100%+4rem)] overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <div className="relative mx-auto flex max-w-[1160px] flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-8">{children}</div>
        </div>
    );
}

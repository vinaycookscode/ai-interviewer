"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";

/** One-click light/dark switch. Icons swap with CSS, so there is no hydration flash. */
export function ThemeSwitch({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={cn(
                "relative inline-flex size-10 shrink-0 items-center justify-center rounded-full text-sg-text transition-colors hover:bg-sg-chip",
                focusRing,
                className
            )}
        >
            <Sun className="size-[18px] scale-100 transition-transform dark:scale-0" aria-hidden="true" />
            <Moon className="absolute size-[18px] scale-0 transition-transform dark:scale-100" aria-hidden="true" />
            <span className="sr-only">Switch between light and dark theme</span>
        </button>
    );
}

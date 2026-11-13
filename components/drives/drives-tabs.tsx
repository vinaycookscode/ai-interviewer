import Link from "next/link";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

/** Drives | Aptitude tests, at the top of both lists (AIIN-226). */
export function DrivesTabs({ current, label, drives, tests }: { current: "drives" | "tests"; label: string; drives: string; tests: string }) {
    const cls = (on: boolean) =>
        cn(
            "inline-flex h-10 items-center rounded-full border-2 px-4 text-sm font-semibold",
            on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text",
            focusRing,
        );
    return (
        <nav aria-label={label} className="flex flex-wrap gap-2">
            <Link href="/dashboard/drives" aria-current={current === "drives" ? "page" : undefined} className={cls(current === "drives")}>
                {drives}
            </Link>
            <Link href="/dashboard/drives/tests" aria-current={current === "tests" ? "page" : undefined} className={cls(current === "tests")}>
                {tests}
            </Link>
        </nav>
    );
}

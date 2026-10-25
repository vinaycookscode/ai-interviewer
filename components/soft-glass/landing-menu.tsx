"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

interface LandingMenuProps {
    links: { href: string; label: string }[];
    labels: { nav: string; open: string; close: string; signIn: string; startFree: string; theme: string };
    className?: string;
}

/** The landing header's menu below lg, where the nav links don't fit. Opens under the header bar. */
export function LandingMenu({ links, labels, className }: LandingMenuProps) {
    const [open, setOpen] = useState(false);
    const panelId = useId();
    const root = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
        const onPointer = (event: PointerEvent) => !root.current?.contains(event.target as Node) && setOpen(false);
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onPointer);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onPointer);
        };
    }, [open]);

    const close = () => setOpen(false);
    const row = cn("flex h-12 items-center rounded-2xl px-4 font-semibold transition-colors hover:bg-sg-chip", focusRing);

    return (
        <div ref={root} className={className}>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={open ? labels.close : labels.open}
                onClick={() => setOpen(!open)}
                className={cn("inline-flex size-10 items-center justify-center rounded-full text-sg-text transition-colors hover:bg-sg-chip", focusRing)}
            >
                {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
            {open && (
                // Solid, not glass: the hero's large heading behind it would bleed through the links.
                <nav
                    id={panelId}
                    aria-label={labels.nav}
                    className="sg-shadow-lg absolute inset-x-0 top-full mt-2 flex flex-col gap-1 rounded-[28px] border border-sg-glass-border bg-sg-bg p-2"
                >
                    {links.map((link) => (
                        <a key={link.href} href={link.href} onClick={close} className={row}>
                            {link.label}
                        </a>
                    ))}
                    <Link href="/auth/login" onClick={close} className={cn(row, "sm:hidden")}>
                        {labels.signIn}
                    </Link>
                    <div className="flex h-12 items-center justify-between pl-4 pr-1 font-semibold sm:hidden">
                        <span>{labels.theme}</span>
                        <ThemeSwitch />
                    </div>
                    {/* The header drops its "Start free" below 360px; this stands in for it. */}
                    <Link
                        href="/auth/register"
                        onClick={close}
                        className={cn(
                            "flex h-12 items-center justify-center rounded-2xl bg-sg-ink font-bold text-sg-ink-foreground transition-opacity hover:opacity-90 min-[360px]:hidden",
                            focusRing
                        )}
                    >
                        {labels.startFree}
                    </Link>
                </nav>
            )}
        </div>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { outlineButton, row } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

const NAV = [
    { key: "overview", href: "/admin" },
    { key: "users", href: "/admin/users" },
    { key: "subscriptions", href: "/admin/subscriptions" },
    { key: "problems", href: "/admin/problems" },
    { key: "visitors", href: "/admin/locations" },
    { key: "features", href: "/admin/features" },
    { key: "feedback", href: "/admin/feedback" },
] as const;

/** The admin console's frame in Soft Glass (AIIN-138): brand, the section pill, the model picker, leave and theme. */
export function AdminShell({ modelPicker, children }: { modelPicker?: React.ReactNode; children: React.ReactNode }) {
    const t = useTranslations("Admin.shell");
    const pathname = usePathname();
    const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));

    return (
        <div className="relative mx-auto flex max-w-[1240px] flex-col gap-6 px-4 pt-4 pb-8 sm:gap-7 sm:px-8">
            <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                <div className="flex items-center gap-2.5">
                    <Link href="/admin" aria-label={t("home")} className={cn("flex items-center gap-2.5 rounded-full", focusRing)}>
                        <UMark className="size-[30px]" />
                        <span className="font-display sg-soft text-[19px] font-semibold whitespace-nowrap">{t("brand")}</span>
                    </Link>
                    <span className="inline-flex h-7 items-center rounded-full bg-sg-ink px-3 text-[13px] font-semibold text-sg-ink-foreground">{t("badge")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {modelPicker}
                    <Link href="/dashboard" className={cn(outlineButton, "h-10 px-4 text-sm")}>
                        {t("leave")}
                    </Link>
                    <ThemeSwitch />
                </div>
                {/* The sections sit on their own row: seven of them and the controls don't share one line */}
                <div className="basis-full">
                    <nav aria-label={t("nav")} className="sg-glass inline-flex flex-wrap gap-1 rounded-[26px] p-[5px]">
                        {NAV.map((item) => (
                            <Link
                                key={item.key}
                                href={item.href}
                                aria-current={active(item.href) ? "page" : undefined}
                                className={cn(
                                    "inline-flex h-[38px] items-center rounded-full px-4 whitespace-nowrap",
                                    active(item.href) ? "bg-sg-ink font-semibold text-sg-ink-foreground" : "font-medium text-sg-muted hover:text-sg-text",
                                    focusRing
                                )}
                            >
                                {t(item.key)}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>
            <p className={cn(row, "md:hidden")}>{t("desktopOnly")}</p>
            <main id="main" className="flex flex-col gap-6 sm:gap-8">
                {children}
            </main>
        </div>
    );
}

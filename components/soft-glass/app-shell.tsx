"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    Briefcase,
    BriefcaseBusiness,
    Building2,
    CalendarCheck,
    ChartLine,
    ChevronDown,
    CreditCard,
    FileText,
    GraduationCap,
    House,
    LayoutDashboard,
    LayoutGrid,
    Layers,
    LogOut,
    Mic,
    Plus,
    Route,
    Settings,
    ShieldCheck,
    Star,
    User,
    Users,
    type LucideIcon,
} from "lucide-react";
import { logout } from "@/actions/logout";
import { FEATURES } from "@/lib/features";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";

type ShellRole = "candidate" | "employer";
type Menu = "more" | "account" | "sheet";

interface NavItem {
    key: string;
    href: string;
    icon: LucideIcon;
    /** Hidden when this feature flag is switched off. */
    feature?: string;
    /** Route prefixes that mark this item as the current page. */
    match: (pathname: string) => boolean;
}

interface MoreGroup {
    key: string;
    items: NavItem[];
}

// Focus pages with their own header: a live practice session, a flashcard study session and onboarding.
const FOCUS_ROUTE = /^\/candidate\/(practice\/[^/]+|flashcards\/[^/]+\/study|onboarding)$/;
const under = (prefix: string) => (pathname: string) => pathname === prefix || pathname.startsWith(prefix + "/");
const exactly = (path: string) => (pathname: string) => pathname === path;

const CANDIDATE_NAV: NavItem[] = [
    { key: "today", href: "/candidate/dashboard", icon: House, match: exactly("/candidate/dashboard") },
    // There is no interviews page yet: the list lives on Today, under #interviews.
    { key: "interviews", href: "/candidate/dashboard#interviews", icon: CalendarCheck, match: under("/candidate/interview") },
    { key: "practice", href: "/candidate/practice", icon: Mic, feature: FEATURES.PRACTICE_INTERVIEWS, match: under("/candidate/practice") },
    { key: "resume", href: "/candidate/resume-screener", icon: FileText, feature: FEATURES.RESUME_SCREENER, match: under("/candidate/resume-screener") },
    { key: "plan", href: "/candidate/placement-program", icon: Route, feature: FEATURES.PLACEMENT_PROGRAM, match: under("/candidate/placement-program") },
];

const CANDIDATE_MORE: MoreGroup[] = [
    {
        key: "prepare",
        items: [
            { key: "companyPrep", href: "/candidate/company-prep", icon: Building2, feature: FEATURES.COMPANY_PREP, match: under("/candidate/company-prep") },
            { key: "flashcards", href: "/candidate/flashcards", icon: Layers, match: under("/candidate/flashcards") },
        ],
    },
    {
        key: "progress",
        items: [
            { key: "analytics", href: "/candidate/dashboard/analytics", icon: ChartLine, feature: FEATURES.ANALYTICS, match: under("/candidate/dashboard/analytics") },
            { key: "offers", href: "/candidate/offers", icon: BriefcaseBusiness, feature: FEATURES.OFFER_COMPARATOR, match: under("/candidate/offers") },
        ],
    },
    {
        key: "community",
        items: [
            { key: "studySquad", href: "/candidate/study-squad", icon: Users, feature: FEATURES.STUDY_SQUAD, match: under("/candidate/study-squad") },
            { key: "mentors", href: "/candidate/mentors", icon: GraduationCap, feature: FEATURES.MENTOR_MATCHING, match: under("/candidate/mentors") },
        ],
    },
];

const EMPLOYER_NAV: NavItem[] = [
    { key: "overview", href: "/dashboard", icon: LayoutDashboard, match: exactly("/dashboard") },
    { key: "jobs", href: "/dashboard/jobs", icon: Briefcase, feature: FEATURES.JOB_MANAGEMENT, match: under("/dashboard/jobs") },
    { key: "candidates", href: "/dashboard/candidates", icon: Users, feature: FEATURES.CANDIDATE_SEARCH, match: under("/dashboard/candidates") },
    { key: "settings", href: "/dashboard/settings", icon: Settings, match: under("/dashboard/settings") },
];

interface AppShellProps {
    role: ShellRole;
    user: { name?: string | null; email?: string | null };
    /** Show the Go Pro prompt (candidates on the free plan). */
    showGoPro?: boolean;
    isAdmin?: boolean;
    featureFlags?: Record<string, boolean>;
    children: React.ReactNode;
}

function initials(name?: string | null, email?: string | null) {
    const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
    return (email?.[0] ?? "U").toUpperCase();
}

/**
 * The signed-in app frame: the floating glass header (nav pill from 1024px, More and account menus)
 * and, below 1024px, a sticky bottom tab bar with a More sheet.
 */
export function AppShell({ role, user, showGoPro = false, isAdmin = false, featureFlags = {}, children }: AppShellProps) {
    const t = useTranslations("AppShell");
    const pathname = usePathname();
    const [open, setOpen] = useState<Menu | null>(null);

    const triggers = {
        more: useRef<HTMLButtonElement>(null),
        account: useRef<HTMLButtonElement>(null),
        sheet: useRef<HTMLButtonElement>(null),
    };
    const panels = {
        more: useRef<HTMLDivElement>(null),
        account: useRef<HTMLDivElement>(null),
        sheet: useRef<HTMLDivElement>(null),
    };

    // Escape closes and returns focus to the button that opened the menu; a tap outside closes.
    useEffect(() => {
        if (!open) return;
        const trigger = triggers[open].current;
        const panel = panels[open].current;
        const onKey = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setOpen(null);
            trigger?.focus();
        };
        const onPointer = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!panel?.contains(target) && !trigger?.contains(target)) setOpen(null);
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onPointer);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onPointer);
        };
        // The refs are stable; only the open menu matters.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    /** Closes the menu when keyboard focus leaves both its button and its panel. */
    const closeOnFocusOut = (menu: Menu) => (event: React.FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (!next) return;
        if (panels[menu].current?.contains(next) || triggers[menu].current?.contains(next)) return;
        setOpen((current) => (current === menu ? null : current));
    };

    const toggle = (menu: Menu) => setOpen((current) => (current === menu ? null : menu));
    const close = () => setOpen(null);

    const enabled = (item: NavItem) => !item.feature || featureFlags[item.feature] !== false;
    const isCandidate = role === "candidate";
    const nav = (isCandidate ? CANDIDATE_NAV : EMPLOYER_NAV).filter(enabled);
    const more = isCandidate
        ? CANDIDATE_MORE.map((group) => ({ ...group, items: group.items.filter(enabled) })).filter((group) => group.items.length > 0)
        : [];
    const moreActive = more.some((group) => group.items.some((item) => item.match(pathname)));
    const planItem = nav.find((item) => item.key === "plan");
    // The tab bar keeps four destinations; the 90-day plan moves into the More sheet.
    const tabs = isCandidate ? nav.filter((item) => item.key !== "plan").slice(0, 4) : nav;
    const sheetActive = moreActive || !!planItem?.match(pathname);
    const homeHref = isCandidate ? "/candidate/dashboard" : "/dashboard";

    const menuPanel = "sg-shadow-lg absolute right-0 top-[calc(100%+8px)] z-50 flex max-w-[calc(100vw-32px)] flex-col gap-0.5 rounded-3xl border border-sg-glass-border bg-sg-bg p-2";
    const groupCaption = "px-3 pb-0.5 pt-2 text-[13px] font-bold leading-[18px] text-sg-muted";

    const menuRow = (item: { key: string; href: string; icon: LucideIcon; hint?: string; active?: boolean }) => {
        const Icon = item.icon;
        return (
            <Link
                key={item.key}
                href={item.href}
                onClick={close}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                    "flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-sg-chip",
                    item.active && "bg-sg-chip",
                    focusRing
                )}
            >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sg-chip" aria-hidden="true">
                    <Icon className="size-[18px]" />
                </span>
                <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{t(item.key)}</span>
                    {item.hint && <span className="text-[13px] font-medium leading-[18px] text-sg-muted">{item.hint}</span>}
                </span>
            </Link>
        );
    };

    const moreRows = more.map((group) => (
        <div key={group.key} role="group" aria-label={t(group.key)} className="flex flex-col gap-0.5">
            <span className={groupCaption} aria-hidden="true">
                {t(group.key)}
            </span>
            {group.items.map((item) =>
                menuRow({ key: item.key, href: item.href, icon: item.icon, hint: t(`${item.key}Hint`), active: item.match(pathname) })
            )}
        </div>
    ));

    // Focus pages get no app chrome.
    if (isCandidate && FOCUS_ROUTE.test(pathname)) return <>{children}</>;

    return (
        <div className="relative mx-auto flex w-full max-w-[1160px] flex-1 flex-col gap-7 px-4 pb-3 pt-4 sm:gap-10 sm:px-8 lg:pb-6">
            <a
                href="#main"
                className={cn(
                    "sr-only rounded-full bg-sg-ink px-4 py-2 font-semibold text-sg-ink-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]",
                    focusRing
                )}
            >
                {t("skip")}
            </a>

            <header className="relative z-40 flex items-center justify-between gap-3">
                {/* A span, not a heading: each page's own title is its only h1. */}
                <Link href={homeHref} aria-label={t("home")} className={cn("flex min-w-0 items-center gap-2.5 rounded-full", focusRing)}>
                    <UMark className="size-8" />
                    <span className="whitespace-nowrap font-display sg-soft text-[17px] font-semibold min-[360px]:text-[19px] xl:text-[21px]" aria-hidden="true">
                        {t("brand")}
                    </span>
                </Link>

                <div className="relative hidden lg:block">
                    <nav aria-label={t("mainNav")} className="sg-glass flex gap-1 rounded-full p-[5px]">
                        {nav.map((item) => {
                            const active = item.match(pathname);
                            return (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className={cn(
                                        "inline-flex h-[38px] items-center whitespace-nowrap rounded-full px-3 transition-colors xl:px-4",
                                        active ? "bg-sg-ink font-semibold text-sg-ink-foreground" : "font-medium text-sg-muted hover:text-sg-text",
                                        focusRing
                                    )}
                                >
                                    {t(item.key)}
                                </Link>
                            );
                        })}
                        {more.length > 0 && (
                            <button
                                ref={triggers.more}
                                type="button"
                                aria-expanded={open === "more"}
                                aria-controls="app-more-menu"
                                onClick={() => toggle("more")}
                                onBlur={closeOnFocusOut("more")}
                                className={cn(
                                    "inline-flex h-[38px] items-center gap-1 whitespace-nowrap rounded-full pl-3 pr-2.5 transition-colors xl:pl-4 xl:pr-3",
                                    moreActive
                                        ? "bg-sg-ink font-semibold text-sg-ink-foreground"
                                        : cn("font-medium text-sg-muted hover:text-sg-text", open === "more" && "bg-sg-chip"),
                                    focusRing
                                )}
                            >
                                {t("more")}
                                <ChevronDown className={cn("size-4 transition-transform", open === "more" && "rotate-180")} aria-hidden="true" />
                            </button>
                        )}
                    </nav>
                    {open === "more" && (
                        <div ref={panels.more} id="app-more-menu" onBlur={closeOnFocusOut("more")} className={cn(menuPanel, "w-[340px]")}>
                            {moreRows}
                        </div>
                    )}
                </div>

                <div className="relative flex shrink-0 items-center gap-1.5">
                    {isCandidate && showGoPro && (
                        <Link
                            href="/candidate/pricing"
                            className={cn("sg-glass hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 font-semibold sm:inline-flex", focusRing)}
                        >
                            <Star className="size-3.5 fill-sg-coral text-sg-coral" aria-hidden="true" />
                            {t("goPro")}
                        </Link>
                    )}
                    {!isCandidate && (
                        <Link
                            href="/dashboard/jobs/new"
                            className={cn(
                                "hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-sg-ink px-4 text-[15px] font-bold text-sg-ink-foreground transition-opacity hover:opacity-90 sm:inline-flex",
                                focusRing
                            )}
                        >
                            <Plus className="size-4" aria-hidden="true" />
                            {t("newJob")}
                        </Link>
                    )}
                    <ThemeSwitch className="hidden sm:inline-flex" />
                    <button
                        ref={triggers.account}
                        type="button"
                        aria-label={t("accountMenu")}
                        aria-expanded={open === "account"}
                        aria-controls="app-account-menu"
                        onClick={() => toggle("account")}
                        onBlur={closeOnFocusOut("account")}
                        className={cn(
                            "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-sg-glass-border bg-sg-glass text-[13px] font-bold",
                            focusRing
                        )}
                    >
                        {initials(user.name, user.email)}
                    </button>
                    {open === "account" && (
                        <div ref={panels.account} id="app-account-menu" onBlur={closeOnFocusOut("account")} className={cn(menuPanel, "w-[280px]")}>
                            <div className="mb-1 flex min-w-0 flex-col border-b border-sg-rule px-3 pb-3 pt-2.5">
                                {user.name && <span className="truncate font-bold">{user.name}</span>}
                                {user.email && <span className="truncate text-sm text-sg-muted">{user.email}</span>}
                            </div>
                            {isCandidate && (
                                <>
                                    {menuRow({ key: "profile", href: "/candidate/profile", icon: User, active: pathname.startsWith("/candidate/profile") })}
                                    {menuRow({
                                        key: "billing",
                                        href: "/candidate/settings/subscription",
                                        icon: CreditCard,
                                        active: pathname.startsWith("/candidate/settings/subscription"),
                                    })}
                                </>
                            )}
                            {isAdmin && menuRow({ key: "admin", href: "/admin", icon: ShieldCheck })}
                            {/* The header drops the theme switch below 640px; it lives here instead. */}
                            <div className="flex min-h-12 items-center justify-between pl-3 font-semibold sm:hidden">
                                <span>{t("theme")}</span>
                                <ThemeSwitch />
                            </div>
                            <form action={logout}>
                                <button
                                    type="submit"
                                    className={cn("flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-sg-chip", focusRing)}
                                >
                                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-sg-chip" aria-hidden="true">
                                        <LogOut className="size-[18px]" />
                                    </span>
                                    <span className="font-semibold">{t("signOut")}</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </header>

            <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none">
                {children}
            </main>

            <nav
                aria-label={t("mainNav")}
                className="sg-bar sticky bottom-3 z-40 mx-auto grid w-full max-w-[560px] gap-0 rounded-[30px] p-1 min-[360px]:gap-0.5 min-[360px]:p-1.5 lg:hidden"
                style={{ gridTemplateColumns: `repeat(${tabs.length + (isCandidate ? 1 : 0)}, minmax(0, 1fr))` }}
            >
                {tabs.map((item) => {
                    const active = item.match(pathname);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className={cn("flex min-h-14 min-w-0 flex-col items-center gap-0.5 rounded-[20px] py-1", focusRing)}
                        >
                            <TabIcon icon={item.icon} active={active} />
                            <TabLabel active={active}>{t(item.key)}</TabLabel>
                        </Link>
                    );
                })}
                {isCandidate && (
                    <button
                        ref={triggers.sheet}
                        type="button"
                        aria-expanded={open === "sheet"}
                        aria-controls="app-more-sheet"
                        onClick={() => toggle("sheet")}
                        onBlur={closeOnFocusOut("sheet")}
                        className={cn("flex min-h-14 min-w-0 flex-col items-center gap-0.5 rounded-[20px] py-1", focusRing)}
                    >
                        <TabIcon icon={LayoutGrid} active={sheetActive || open === "sheet"} />
                        <TabLabel active={sheetActive || open === "sheet"}>{t("more")}</TabLabel>
                    </button>
                )}
            </nav>

            {isCandidate && open === "sheet" && (
                <div
                    ref={panels.sheet}
                    id="app-more-sheet"
                    onBlur={closeOnFocusOut("sheet")}
                    className="sg-shadow-lg fixed inset-x-4 bottom-[92px] z-50 mx-auto flex max-h-[calc(100dvh-120px)] max-w-[560px] flex-col gap-0.5 overflow-y-auto rounded-[28px] border border-sg-glass-border bg-sg-bg p-2 lg:hidden"
                >
                    {planItem && menuRow({ key: "plan", href: planItem.href, icon: Route, hint: t("planHint"), active: planItem.match(pathname) })}
                    {moreRows}
                    {showGoPro && (
                        <Link
                            href="/candidate/pricing"
                            onClick={close}
                            className={cn(
                                "mt-1.5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sg-coral font-bold text-sg-coral-ink transition-opacity hover:opacity-90",
                                focusRing
                            )}
                        >
                            <Star className="size-4 fill-sg-coral-ink" aria-hidden="true" />
                            {t("goPro")}
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

function TabIcon({ icon: Icon, active }: { icon: LucideIcon; active: boolean }) {
    return (
        <span
            aria-hidden="true"
            className={cn(
                "inline-flex h-[30px] w-12 max-w-full items-center justify-center rounded-full",
                active ? "bg-sg-ink text-sg-ink-foreground" : "text-sg-muted"
            )}
        >
            <Icon className="size-5" />
        </span>
    );
}

function TabLabel({ active, children }: { active: boolean; children: React.ReactNode }) {
    // 12px only below 360px, where five 13px labels ("Interviews") can't fit their columns.
    return (
        <span
            className={cn(
                "max-w-full truncate text-[12px] leading-4 tracking-[-0.01em] min-[360px]:text-[13px]",
                active ? "font-bold text-sg-text" : "font-semibold text-sg-muted"
            )}
        >
            {children}
        </span>
    );
}

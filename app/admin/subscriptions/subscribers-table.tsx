"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Ban, Check, Clock, Search } from "lucide-react";
import { chip, filterPill, td, th, tr } from "@/components/admin/admin-ui";
import { fieldInput, focusRing } from "@/components/soft-glass/classes";
import { outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SubscriberRow {
    id: string;
    name: string | null;
    email: string | null;
    plan: string;
    billing: string;
    status: string;
    left: number | null;
    amount: string;
    since: string;
}

const STATUSES = ["all", "ACTIVE", "PAST_DUE", "CANCELLED", "EXPIRED"] as const;
const ICONS = { ACTIVE: Check, PAST_DUE: AlertCircle, CANCELLED: Ban, EXPIRED: Clock } as const;

/** Everyone who's paid: search and status in the address (AIIN-138). Status is told by icon and word. */
export function SubscribersTable({ rows, q, status, page, pages }: { rows: SubscriberRow[]; q: string; status: string | null; page: number; pages: number }) {
    const t = useTranslations("Admin.subscriptions");
    const router = useRouter();
    const href = (changes: Record<string, string | null>) => {
        const next = new URLSearchParams();
        for (const [k, v] of Object.entries({ q: q || null, status, page: null as string | null, ...changes })) if (v) next.set(k, v);
        return `/admin/subscriptions${next.size ? `?${next}` : ""}`;
    };
    const label = (s: string) => (t.has(`statuses.${s}`) ? t(`statuses.${s}`) : s);

    return (
        <section aria-labelledby="subs-title" className={panel}>
            <h2 id="subs-title" className={panelTitle}>
                {t("everyone")}
            </h2>
            <div className="flex flex-wrap items-center gap-2.5">
                <form
                    role="search"
                    className="relative min-w-[min(260px,100%)] flex-[1_1_280px]"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.push(href({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() || null }));
                    }}
                >
                    <label htmlFor="as-search" className="sr-only">
                        {t("search")}
                    </label>
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-sg-muted" aria-hidden="true" />
                    <Input id="as-search" name="q" type="search" defaultValue={q} placeholder={t("search")} className={cn(fieldInput, "pl-11")} />
                </form>
                <div role="group" aria-label={t("status")} className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => {
                        const on = (status ?? "all") === s;
                        return (
                            <Link key={s} href={href({ status: s === "all" ? null : s })} aria-current={on ? "true" : undefined} className={cn(filterPill(on), focusRing)}>
                                {label(s)}
                            </Link>
                        );
                    })}
                </div>
            </div>
            {rows.length === 0 ? (
                <p className="py-6 text-center text-sg-muted">{t("none")}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] border-collapse text-[15px]">
                        <caption className="sr-only">{t("caption")}</caption>
                        <thead>
                            <tr>
                                <th scope="col" className={th}>{t("colSubscriber")}</th>
                                <th scope="col" className={th}>{t("colPlan")}</th>
                                <th scope="col" className={th}>{t("colBilling")}</th>
                                <th scope="col" className={th}>{t("colStatus")}</th>
                                <th scope="col" className={cn(th, "text-right")}>{t("colLeft")}</th>
                                <th scope="col" className={cn(th, "text-right")}>{t("colAmount")}</th>
                                <th scope="col" className={th}>{t("colSince")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => {
                                const Icon = ICONS[r.status as keyof typeof ICONS] ?? Clock;
                                return (
                                    <tr key={r.id} className={tr}>
                                        <th scope="row" className={cn(td, "font-semibold")}>
                                            <span className="flex flex-col">
                                                <span>{r.name || t("noName")}</span>
                                                <span className="text-[13px] font-medium text-sg-muted [overflow-wrap:anywhere]">{r.email}</span>
                                            </span>
                                        </th>
                                        <td className={td}>{r.plan}</td>
                                        <td className={td}>{t.has(`billing.${r.billing}`) ? t(`billing.${r.billing}`) : r.billing}</td>
                                        <td className={td}>
                                            <span className={cn(chip, r.status === "ACTIVE" ? "bg-sg-chip" : r.status === "PAST_DUE" ? "bg-sg-danger/10 text-sg-danger" : "border border-dashed border-sg-field-border text-sg-muted")}>
                                                <Icon className="size-3.5" aria-hidden="true" />
                                                {label(r.status)}
                                            </span>
                                        </td>
                                        <td className={cn(td, "text-right whitespace-nowrap")}>{r.left === null ? "—" : t("daysLeft", { count: r.left })}</td>
                                        <td className={cn(td, "text-right font-bold tabular-nums")}>{r.amount}</td>
                                        <td className={cn(td, "whitespace-nowrap text-sg-muted")}>{r.since}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {pages > 1 && (
                <nav aria-label={t("pages")} className="flex items-center justify-between gap-3">
                    {page > 1 ? (
                        <Link href={href({ page: String(page - 1) })} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("prev")}
                        </Link>
                    ) : (
                        <span />
                    )}
                    <span className="text-sm font-semibold text-sg-muted">{t("page", { page, total: pages })}</span>
                    {page < pages ? (
                        <Link href={href({ page: String(page + 1) })} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("next")}
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            )}
        </section>
    );
}

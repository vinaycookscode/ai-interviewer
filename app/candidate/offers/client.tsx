"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarClock, FileText, Plus } from "lucide-react";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { toast } from "sonner";
import { deleteOffer, updateOfferStatus } from "@/actions/job-offers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel, AlertDialogTrigger } from "@/components/interviews/sg-dialog";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { dangerButton, inkButton, outlineButton, panel, panelTitle, sectionTitle } from "@/components/jobs/employer-ui";
import { companyInitial } from "@/lib/company-prep-format";
import { cn } from "@/lib/utils";

export interface OfferCard {
    id: string;
    company: string;
    role: string;
    location: string;
    status: string;
    base: number;
    bonus: number;
    stocks: number;
    /** ISO date */
    deadline: string | null;
    letterHref: string | null;
}

const DAY = 24 * 60 * 60 * 1000;
const STATUSES = ["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED"] as const;

/** ₹12,00,000 */
const rupees = (n: number) => (n > 0 ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—");
/** ₹14.6 LPA */
const lpa = (n: number) => `₹${Math.round((n / 100000) * 10) / 10} LPA`;
const total = (o: OfferCard) => o.base + o.bonus + o.stocks;
const daysLeft = (iso: string, now: number) => Math.ceil((new Date(iso).getTime() - now) / DAY);
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export function OffersClient({ offers }: { offers: OfferCard[] }) {
    const t = useTranslations("Offers");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [now] = useState(() => Date.now());
    const [tip, setTip] = useState(0);

    const open = offers.filter((o) => o.status === "PENDING" || o.status === "NEGOTIATING");
    const urgent = open
        .filter((o) => o.deadline && daysLeft(o.deadline, now) >= 0)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];
    const byPay = [...offers].sort((a, b) => total(b) - total(a));
    const maxPay = Math.max(1, ...byPay.map(total));
    const statusName = (s: string) => ((STATUSES as readonly string[]).includes(s) ? t(`status.${s as (typeof STATUSES)[number]}`) : s);
    const when = (days: number) => (days <= 0 ? t("today") : t("inDays", { count: days }));

    const setStatus = (id: string, status: string) =>
        startTransition(async () => {
            const result = await updateOfferStatus(id, status);
            if ("error" in result) toast.error(t("failed"));
            router.refresh();
        });

    const remove = (id: string) =>
        startTransition(async () => {
            const result = await deleteOffer(id);
            if ("error" in result) toast.error(t("failed"));
            router.refresh();
        });

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-[640px] flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                    <p className="text-lg text-sg-muted">{t("description")}</p>
                </div>
                {offers.length > 0 && (
                    <Link href="/candidate/offers/new" className={cn(coralButton, "h-12 px-6 text-base")}>
                        <Plus className="size-[18px]" aria-hidden="true" />
                        {t("add")}
                    </Link>
                )}
            </div>

            {offers.length === 0 ? (
                <EmptyState
                    title={t("emptyTitle")}
                    action={
                        <Link href="/candidate/offers/new" className={cn(coralButton, "h-12 px-6")}>
                            <Plus className="size-[18px]" aria-hidden="true" />
                            {t("emptyAdd")}
                        </Link>
                    }
                >
                    {t("emptyBody")}
                </EmptyState>
            ) : (
                <>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4">
                        <section aria-label={t("count")} className={panel}>
                            <dl className="grid grid-cols-3 gap-2.5">
                                {[
                                    [offers.length, t("count")],
                                    [offers.filter((o) => o.status === "PENDING").length, t("waiting")],
                                    [offers.filter((o) => o.status === "NEGOTIATING").length, t("negotiating")],
                                ].map(([value, label]) => (
                                    <div key={label} className="flex flex-col">
                                        <dd className="font-display sg-soft text-[28px] leading-[34px] font-semibold">{value}</dd>
                                        <dt className="order-last text-[13px] leading-[18px] font-bold text-sg-muted">{label}</dt>
                                    </div>
                                ))}
                            </dl>
                            {urgent?.deadline && (
                                <p className="flex items-center gap-2 text-[15px]">
                                    <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
                                    <span>{t.rich("urgent", { company: urgent.company, when: when(daysLeft(urgent.deadline, now)), strong: (c) => <strong>{c}</strong> })}</span>
                                </p>
                            )}
                        </section>

                        <section aria-label={t("payTitle")} className={panel}>
                            <h2 className={panelTitle}>{t("payTitle")}</h2>
                            <ul aria-label={t("payLabel")} className="flex flex-col gap-2.5">
                                {byPay.map((o, i) => (
                                    <li key={o.id} className="grid grid-cols-[minmax(84px,120px)_1fr] items-center gap-3">
                                        <span className="truncate font-semibold">{o.company}</span>
                                        <button
                                            type="button"
                                            onClick={() => setTip(i)}
                                            onFocus={() => setTip(i)}
                                            onMouseEnter={() => setTip(i)}
                                            aria-label={t("barLabel", { company: o.company, total: lpa(total(o)), base: rupees(o.base), bonus: rupees(o.bonus), stocks: rupees(o.stocks) })}
                                            className={cn("flex min-w-0 items-center gap-2 rounded-md py-1 text-left", focusRing)}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className={cn("block h-5 min-w-2 rounded", tip === i ? "bg-sg-ink" : "bg-sg-lavender-ink")}
                                                style={{ width: `${Math.round((total(o) / maxPay) * 70)}%` }}
                                            />
                                            <span className="text-sm font-bold whitespace-nowrap">{lpa(total(o))}</span>
                                            {i === 0 && byPay.length > 1 && (
                                                <span className="hidden h-6 items-center rounded-full bg-sg-chip px-2 text-[13px] font-semibold sm:inline-flex">{t("highest")}</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {byPay[tip] && (
                                <p aria-live="polite" className="rounded-[14px] bg-sg-row px-3.5 py-2.5 text-sm">
                                    <strong>{byPay[tip].company}</strong> · {t("breakdown", { base: rupees(byPay[tip].base), bonus: rupees(byPay[tip].bonus), stocks: rupees(byPay[tip].stocks) })}
                                </p>
                            )}
                            <span className="text-[13px] leading-[18px] text-sg-muted">{t("payNote")}</span>
                        </section>
                    </div>

                    <section aria-label={t("yours")} className="flex flex-col gap-4">
                        <h2 className={sectionTitle}>{t("yours")}</h2>
                        <ul className="flex flex-col gap-4">
                            {offers.map((o) => {
                                const days = o.deadline ? daysLeft(o.deadline, now) : null;
                                const isOpen = o.status === "PENDING" || o.status === "NEGOTIATING";
                                return (
                                    <li key={o.id} className="sg-glass flex flex-col gap-4 rounded-[24px] p-5 sm:p-6">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span aria-hidden="true" className="font-display sg-soft flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sg-chip text-xl font-semibold">
                                                {companyInitial(o.company)}
                                            </span>
                                            <div className="flex min-w-0 flex-[1_1_200px] flex-col">
                                                <span className="text-xl leading-7 font-bold">{o.company}</span>
                                                <span className="text-sg-muted">
                                                    {o.role} · {o.location}
                                                </span>
                                            </div>
                                            <span className="inline-flex h-7 items-center rounded-full bg-sg-chip px-2.5 text-sm font-semibold">{statusName(o.status)}</span>
                                        </div>
                                        {o.deadline && days !== null && isOpen && (
                                            <span className={cn("inline-flex items-center gap-2 text-[15px]", days <= 3 ? "font-bold" : "font-medium text-sg-muted")}>
                                                <CalendarClock className="size-4" aria-hidden="true" />
                                                {days < 0 ? t("deadlinePassed", { date: shortDate(o.deadline) }) : t("deadline", { date: shortDate(o.deadline), when: when(days) })}
                                            </span>
                                        )}
                                        <dl className="grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-3 rounded-[18px] bg-sg-row p-4">
                                            {[
                                                [t("base"), rupees(o.base)],
                                                [t("bonus"), rupees(o.bonus)],
                                                [t("stocks"), rupees(o.stocks)],
                                            ].map(([label, value]) => (
                                                <div key={label} className="flex flex-col">
                                                    <dt className="text-[13px] leading-[18px] font-bold text-sg-muted">{label}</dt>
                                                    <dd className="font-semibold">{value}</dd>
                                                </div>
                                            ))}
                                            <div className="flex flex-col">
                                                <dt className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("total")}</dt>
                                                <dd className="text-lg font-bold">{lpa(total(o))}</dd>
                                            </div>
                                        </dl>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {isOpen ? (
                                                <>
                                                    <button type="button" disabled={isPending} onClick={() => setStatus(o.id, "ACCEPTED")} className={cn(inkButton, "h-10 px-4 text-sm")}>
                                                        {t("accept")}
                                                    </button>
                                                    {o.status !== "NEGOTIATING" && (
                                                        <button type="button" disabled={isPending} onClick={() => setStatus(o.id, "NEGOTIATING")} className={cn(outlineButton, "h-10 text-sm")}>
                                                            {t("markNegotiating")}
                                                        </button>
                                                    )}
                                                    <button type="button" disabled={isPending} onClick={() => setStatus(o.id, "REJECTED")} className={cn(outlineButton, "h-10 text-sm")}>
                                                        {t("decline")}
                                                    </button>
                                                </>
                                            ) : (
                                                <button type="button" disabled={isPending} onClick={() => setStatus(o.id, "PENDING")} className={cn(outlineButton, "h-10 text-sm")}>
                                                    {t("reopen")}
                                                </button>
                                            )}
                                            <span className="flex-1" />
                                            {o.letterHref && (
                                                <a href={o.letterHref} target="_blank" rel="noreferrer" className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold hover:bg-sg-chip", focusRing)}>
                                                    <FileText className="size-4" aria-hidden="true" />
                                                    {t("letter")}
                                                </a>
                                            )}
                                            <Link
                                                href={`/candidate/offers/${o.id}/edit`}
                                                aria-label={t("editLabel", { company: o.company })}
                                                className={cn("inline-flex min-h-10 items-center rounded-full px-3 text-sm font-bold hover:bg-sg-chip", focusRing)}
                                            >
                                                {t("edit")}
                                            </Link>
                                            <AlertDialog>
                                                <AlertDialogTrigger
                                                    aria-label={t("deleteLabel", { company: o.company })}
                                                    className={cn("inline-flex min-h-10 items-center rounded-full px-3 text-sm font-bold text-sg-danger hover:bg-sg-danger/10", focusRing)}
                                                >
                                                    {t("delete")}
                                                </AlertDialogTrigger>
                                                <AlertDialogPanel title={t("deleteTitle")} description={t("deleteBody", { company: o.company })}>
                                                    <AlertDialogCancel className={cn(outlineButton, "h-12 px-5 text-base")}>{t("cancel")}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => remove(o.id)} className={dangerButton}>
                                                        {t("delete")}
                                                    </AlertDialogAction>
                                                </AlertDialogPanel>
                                            </AlertDialog>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                </>
            )}
        </div>
    );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUserFeedback, updateUserFeedbackStatus } from "@/actions/user-feedback";
import { chip, filterPill } from "@/components/admin/admin-ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogPanel, AlertDialogTrigger } from "@/components/interviews/sg-dialog";
import { focusRing } from "@/components/soft-glass/classes";
import { dangerButton, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface FeedbackItem {
    id: string;
    who: string | null;
    content: string;
    page: string | null;
    category: string;
    status: string;
    when: string;
}

interface FeedbackListClientProps {
    items: FeedbackItem[];
    filters: { status: string; count: number }[];
    status: string;
    page: number;
    pages: number;
}

/** Feedback as an accordion: open one to review, resolve, dismiss or delete it (AIIN-138). */
export function FeedbackListClient({ items, filters, status, page, pages }: FeedbackListClientProps) {
    const t = useTranslations("Admin.feedback");
    const router = useRouter();
    const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
    const [pending, startTransition] = useTransition();

    const href = (s: string, p = 1) => `/admin/feedback?${new URLSearchParams({ ...(s !== "ALL" ? { status: s } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;
    const statusLabel = (s: string) => (t.has(`statuses.${s}`) ? t(`statuses.${s}`) : s);

    const setStatus = (id: string, next: string) =>
        startTransition(async () => {
            const result = await updateUserFeedbackStatus(id, next);
            if (result.error) toast.error(t("failed"));
            else {
                toast.success(t("updated", { status: statusLabel(next).toLowerCase() }));
                router.refresh();
            }
        });

    const remove = (id: string) =>
        startTransition(async () => {
            const result = await deleteUserFeedback(id);
            if (result.error) toast.error(t("failed"));
            else {
                toast.success(t("deleted"));
                router.refresh();
            }
        });

    return (
        <>
            <div role="group" aria-label={t("status")} className="flex flex-wrap gap-2">
                {filters.map((f) => (
                    <Link key={f.status} href={href(f.status)} aria-current={status === f.status ? "true" : undefined} className={cn(filterPill(status === f.status), focusRing)}>
                        {t("filter", { label: statusLabel(f.status), count: f.count })}
                    </Link>
                ))}
            </div>

            {items.length === 0 ? (
                <p className="sg-glass max-w-[900px] rounded-[22px] p-8 text-center text-sg-muted">{t("none")}</p>
            ) : (
                <ul className="flex max-w-[900px] flex-col gap-2.5">
                    {items.map((item) => {
                        const expanded = open === item.id;
                        return (
                            <li key={item.id} className="sg-glass overflow-hidden rounded-[22px]">
                                <button
                                    type="button"
                                    aria-expanded={expanded}
                                    aria-controls={`fb-${item.id}`}
                                    onClick={() => setOpen(expanded ? null : item.id)}
                                    className={cn("flex w-full items-start gap-3.5 rounded-[22px] px-5 py-4 text-left", focusRing)}
                                >
                                    <span className="flex min-w-0 flex-1 flex-col gap-2">
                                        <span className="flex flex-wrap gap-1.5">
                                            <span className={cn(chip, "bg-sg-chip")}>{t.has(`categories.${item.category}`) ? t(`categories.${item.category}`) : item.category}</span>
                                            <span className={cn(chip, item.status === "NEW" ? "bg-sg-ink text-sg-ink-foreground" : "bg-sg-chip")}>{statusLabel(item.status)}</span>
                                        </span>
                                        <span className={cn("text-[15px] leading-[23px] whitespace-pre-line [overflow-wrap:anywhere]", !expanded && "line-clamp-2")}>{item.content}</span>
                                        <span className="text-[13px] text-sg-muted">
                                            {item.who ?? t("anonymous")} · {item.when}
                                            {item.page ? ` · ${t("onPage", { page: item.page })}` : ""}
                                        </span>
                                    </span>
                                    <ChevronDown aria-hidden="true" className={cn("mt-1 size-[18px] shrink-0 transition-transform", expanded && "rotate-180")} />
                                </button>
                                {expanded && (
                                    <div id={`fb-${item.id}`} className="flex flex-wrap gap-2 px-5 pb-[18px]">
                                        {item.status !== "REVIEWED" && (
                                            <button type="button" disabled={pending} onClick={() => setStatus(item.id, "REVIEWED")} className={cn(inkButton, "h-10 px-4 text-sm")}>
                                                {t("markReviewed")}
                                            </button>
                                        )}
                                        {item.status !== "RESOLVED" && (
                                            <button type="button" disabled={pending} onClick={() => setStatus(item.id, "RESOLVED")} className={cn(outlineButton, "h-10 text-sm")}>
                                                {t("resolve")}
                                            </button>
                                        )}
                                        {item.status !== "DISMISSED" && (
                                            <button type="button" disabled={pending} onClick={() => setStatus(item.id, "DISMISSED")} className={cn(outlineButton, "h-10 text-sm")}>
                                                {t("dismiss")}
                                            </button>
                                        )}
                                        {item.status !== "NEW" && (
                                            <button type="button" disabled={pending} onClick={() => setStatus(item.id, "NEW")} className={cn(outlineButton, "h-10 text-sm")}>
                                                {t("reopen")}
                                            </button>
                                        )}
                                        <span className="flex-1" />
                                        <AlertDialog>
                                            <AlertDialogTrigger disabled={pending} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-bold text-sg-danger hover:bg-sg-chip", focusRing)}>
                                                <Trash2 className="size-3.5" aria-hidden="true" />
                                                {t("delete")}
                                            </AlertDialogTrigger>
                                            <AlertDialogPanel title={t("deleteTitle")} description={t("deleteBody")}>
                                                <AlertDialogCancel className={cn(outlineButton, "h-12 px-5 text-base")}>{t("cancel")}</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => remove(item.id)} className={dangerButton}>
                                                    {t("confirmDelete")}
                                                </AlertDialogAction>
                                            </AlertDialogPanel>
                                        </AlertDialog>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {pages > 1 && (
                <nav aria-label={t("pages")} className="flex max-w-[900px] items-center justify-between gap-3">
                    {page > 1 ? (
                        <Link href={href(status, page - 1)} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("prev")}
                        </Link>
                    ) : (
                        <span />
                    )}
                    <span className="text-sm font-semibold text-sg-muted">{t("page", { page, total: pages })}</span>
                    {page < pages ? (
                        <Link href={href(status, page + 1)} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("next")}
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            )}
        </>
    );
}

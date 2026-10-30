"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Copy, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteUser } from "@/actions/admin";
import { RoleChip, filterPill, td, th, tr } from "@/components/admin/admin-ui";
import { Dialog, DialogPanel } from "@/components/interviews/sg-dialog";
import { fieldInput, focusRing } from "@/components/soft-glass/classes";
import { dangerButton, iconButton, label, outlineButton } from "@/components/jobs/employer-ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UserRow {
    id: string;
    name: string | null;
    email: string;
    role: string;
    joined: string;
    activity: string;
}

interface UsersTableProps {
    users: UserRow[];
    total: number;
    page: number;
    pages: number;
    q: string;
    role: string | null;
}

const ROLES = ["all", "CANDIDATE", "EMPLOYER", "ADMIN"] as const;

/** The users list: search and role in the address, copy an ID, delete after typing the email (AIIN-138). */
export function UsersTable({ users, total, page, pages, q, role }: UsersTableProps) {
    const t = useTranslations("Admin.users");
    const roles = useTranslations("Admin.roles");
    const router = useRouter();
    const [target, setTarget] = useState<UserRow | null>(null);
    const [typed, setTyped] = useState("");
    const [deleting, startDeleting] = useTransition();

    const href = (changes: Record<string, string | null>) => {
        const next = new URLSearchParams();
        const merged = { q: q || null, role, page: null as string | null, ...changes };
        for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
        return `/admin/users${next.size ? `?${next}` : ""}`;
    };
    const nameOf = (u: UserRow) => u.name || u.email;

    const remove = () =>
        startDeleting(async () => {
            if (!target) return;
            const result = await deleteUser(target.id);
            if (result.error) toast.error(result.error === "self" ? t("self") : t("failed"));
            else {
                toast.success(t("deleted"));
                setTarget(null);
                router.refresh();
            }
        });

    return (
        <>
            <div className="flex flex-wrap items-center gap-2.5">
                <form
                    role="search"
                    className="relative min-w-[min(280px,100%)] flex-[1_1_320px]"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.push(href({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() || null }));
                    }}
                >
                    <label htmlFor="au-search" className="sr-only">
                        {t("search")}
                    </label>
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-sg-muted" aria-hidden="true" />
                    <Input id="au-search" name="q" type="search" defaultValue={q} placeholder={t("search")} className={cn(fieldInput, "pl-11")} />
                </form>
                <div role="group" aria-label={t("role")} className="flex flex-wrap gap-2">
                    {ROLES.map((r) => {
                        const on = (role ?? "all") === r;
                        return (
                            <Link key={r} href={href({ role: r === "all" ? null : r })} aria-current={on ? "true" : undefined} className={cn(filterPill(on), focusRing)}>
                                {t(`filters.${r}`)}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <section className="sg-glass flex flex-col gap-2 rounded-[28px] px-2 pt-2 pb-4 sm:px-4">
                <div className="flex justify-between gap-3 px-2 pt-2.5">
                    <span className="font-bold">{t("count", { count: total })}</span>
                    <span className={label}>{t("order")}</span>
                </div>
                {users.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sg-muted">{t("none")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse text-[15px]">
                            <caption className="sr-only">{t("caption")}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={th}>{t("colUser")}</th>
                                    <th scope="col" className={th}>{t("colRole")}</th>
                                    <th scope="col" className={th}>{t("colJoined")}</th>
                                    <th scope="col" className={th}>{t("colActivity")}</th>
                                    <th scope="col" className={cn(th, "text-right")}>{t("colActions")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id} className={tr}>
                                        <th scope="row" className={cn(td, "font-semibold")}>
                                            <span className="flex flex-col">
                                                <span>{u.name || t("noName")}</span>
                                                <span className="text-[13px] font-medium text-sg-muted [overflow-wrap:anywhere]">{u.email}</span>
                                            </span>
                                        </th>
                                        <td className={td}>
                                            <RoleChip role={u.role} label={roles(u.role as "ADMIN")} />
                                        </td>
                                        <td className={cn(td, "whitespace-nowrap text-sg-muted")}>{u.joined}</td>
                                        <td className={cn(td, "whitespace-nowrap")}>{u.activity}</td>
                                        <td className={cn(td, "text-right")}>
                                            <span className="inline-flex gap-1">
                                                <button
                                                    type="button"
                                                    aria-label={t("copy", { name: nameOf(u) })}
                                                    onClick={() => navigator.clipboard.writeText(u.id).then(() => toast.success(t("copied")))}
                                                    className={iconButton}
                                                >
                                                    <Copy className="size-4" aria-hidden="true" />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={t("delete", { name: nameOf(u) })}
                                                    onClick={() => {
                                                        setTyped("");
                                                        setTarget(u);
                                                    }}
                                                    className={cn(iconButton, "text-sg-danger")}
                                                >
                                                    <Trash2 className="size-4" aria-hidden="true" />
                                                </button>
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {pages > 1 && (
                    <nav aria-label={t("pages")} className="flex items-center justify-between gap-3 px-2 pt-1">
                        {page > 1 ? (
                            <Link href={href({ page: String(page - 1) })} className={cn(outlineButton, "h-10 text-sm")}>
                                {t("prev")}
                            </Link>
                        ) : (
                            <span aria-hidden="true" className={cn(outlineButton, "h-10 text-sm opacity-40")}>
                                {t("prev")}
                            </span>
                        )}
                        <span className="text-sm font-semibold text-sg-muted">{t("page", { page, total: pages })}</span>
                        {page < pages ? (
                            <Link href={href({ page: String(page + 1) })} className={cn(outlineButton, "h-10 text-sm")}>
                                {t("next")}
                            </Link>
                        ) : (
                            <span aria-hidden="true" className={cn(outlineButton, "h-10 text-sm opacity-40")}>
                                {t("next")}
                            </span>
                        )}
                    </nav>
                )}
            </section>

            <Dialog open={!!target} onOpenChange={(open) => !open && setTarget(null)}>
                {target && (
                    <DialogPanel title={t("deleteTitle", { name: nameOf(target) })} closeLabel={t("close")} description={t("deleteBody", { email: target.email })}>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="del-confirm" className="text-sm font-semibold">
                                {t("confirmLabel")}
                            </label>
                            <Input id="del-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={target.email} autoComplete="off" className={fieldInput} />
                        </div>
                        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setTarget(null)} className={cn(outlineButton, "h-12 px-5 text-base")}>
                                {t("cancel")}
                            </button>
                            <button type="button" onClick={remove} disabled={deleting || typed.trim().toLowerCase() !== target.email.toLowerCase()} className={dangerButton}>
                                {deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                {deleting ? t("deleting") : t("confirm")}
                            </button>
                        </div>
                    </DialogPanel>
                )}
            </Dialog>
        </>
    );
}

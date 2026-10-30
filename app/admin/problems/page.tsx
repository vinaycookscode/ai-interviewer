import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DIFFICULTIES, PROBLEM_TYPES, STATUSES, testCounts } from "@/lib/problems/rules";
import { createProblem } from "@/actions/admin-problems";
import { AdminGlass } from "@/components/admin/admin-glass";
import { ProblemFilters } from "@/components/admin/problem-filters";
import { StatusChip } from "@/components/admin/problem-status";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { label, outlineButton, row } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("AdminProblems");
    return { title: t("metaTitle") };
}

const PAGE_SIZE = 50;
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

interface Params {
    q?: string;
    kit?: string;
    type?: string;
    difficulty?: string;
    status?: string;
    page?: string;
}

/** Every problem in company prep and the daily challenge, for admins (AIIN-107). */
export default async function AdminProblemsPage({ searchParams }: { searchParams: Promise<Params> }) {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") redirect("/dashboard");
    const t = await getTranslations("AdminProblems");
    const { q, kit, type, difficulty, status, page: pageParam } = await searchParams;

    const where: Prisma.CompanyQuestionWhereInput = {
        ...(q ? { OR: [{ question: { contains: q, mode: "insensitive" } }, { tags: { has: q } }] } : {}),
        ...(kit ? { kitId: kit } : {}),
        ...(type ? { type } : {}),
        ...(difficulty ? { difficulty } : {}),
        // Published and drafts unless asked; "ALL" adds the archived
        status: status === "ALL" ? undefined : status && (STATUSES as readonly string[]).includes(status) ? status : { in: ["DRAFT", "PUBLISHED"] },
    };
    const page = Math.max(1, Number(pageParam) || 1);

    const [total, rows, kits] = await Promise.all([
        db.companyQuestion.count({ where }),
        db.companyQuestion.findMany({
            where,
            orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
            select: {
                id: true,
                question: true,
                type: true,
                difficulty: true,
                status: true,
                testCases: true,
                updatedAt: true,
                kit: { select: { company: true } },
                changes: { orderBy: { createdAt: "desc" }, take: 1, select: { authorName: true, createdAt: true } },
            },
        }),
        db.companyPrepKit.findMany({ orderBy: { company: "asc" }, select: { id: true, company: true } }),
    ]);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const pageHref = (n: number) => {
        const next = new URLSearchParams(Object.entries({ q, kit, type, difficulty, status }).filter((e): e is [string, string] => !!e[1]));
        next.set("page", String(n));
        return `/admin/problems?${next}`;
    };

    const th = cn(label, "px-3 py-2.5 text-left whitespace-nowrap");

    return (
        <AdminGlass>
            <p className={cn(row, "md:hidden")}>{t("desktopOnly")}</p>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-[680px] flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] sm:text-[44px]">{t("title")}</h1>
                    <p className="text-lg text-sg-muted">{t("description")}</p>
                </div>
                <form action={createProblem}>
                    <button type="submit" className={cn(coralButton, "h-12 px-6 text-base")}>
                        <Plus className="size-[18px]" aria-hidden="true" />
                        {t("new")}
                    </button>
                </form>
            </div>

            <ProblemFilters
                kits={kits}
                types={PROBLEM_TYPES.map((v) => ({ value: v, label: t(`types.${v}`) }))}
                difficulties={DIFFICULTIES.map((v) => ({ value: v, label: t(`difficulties.${v}`) }))}
                statuses={[...STATUSES.map((v) => ({ value: v, label: t(`statuses.${v}`) })), { value: "ALL", label: t("statusAll") }]}
            />

            <section className="sg-glass flex flex-col gap-2 rounded-[28px] px-2 pt-2 pb-4 sm:px-4">
                <div className="flex justify-between gap-3 px-2 pt-2.5">
                    <span className="font-bold">{t("count", { count: total })}</span>
                    <span className={label}>{t("order")}</span>
                </div>
                {rows.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sg-muted">{t("none")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-separate border-spacing-y-1.5 text-[15px]">
                            <caption className="sr-only">{t("caption")}</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className={th}>{t("colProblem")}</th>
                                    <th scope="col" className={th}>{t("type")}</th>
                                    <th scope="col" className={th}>{t("difficulty")}</th>
                                    <th scope="col" className={th}>{t("colTests")}</th>
                                    <th scope="col" className={th}>{t("status")}</th>
                                    <th scope="col" className={th}>{t("colChanged")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => {
                                    const tests = Array.isArray(r.testCases) ? testCounts(r.testCases as { hidden?: boolean }[]) : null;
                                    const change = r.changes[0];
                                    return (
                                        <tr key={r.id} className="bg-sg-row">
                                            <th scope="row" className="rounded-l-2xl p-3 text-left font-normal">
                                                <Link href={`/admin/problems/${r.id}`} className={cn("flex flex-col rounded-md", focusRing)}>
                                                    <span className="font-bold">{r.question}</span>
                                                    <span className="text-[13px] text-sg-muted">{r.kit.company}</span>
                                                </Link>
                                            </th>
                                            <td className="p-3">{t.has(`types.${r.type}`) ? t(`types.${r.type}`) : r.type}</td>
                                            <td className="p-3">{t.has(`difficulties.${r.difficulty}`) ? t(`difficulties.${r.difficulty}`) : r.difficulty}</td>
                                            <td className="p-3 whitespace-nowrap">{r.type === "CODING" && tests ? t("tests", tests) : t("noTests")}</td>
                                            <td className="p-3">
                                                <StatusChip status={r.status} label={t.has(`statuses.${r.status}`) ? t(`statuses.${r.status}`) : r.status} />
                                            </td>
                                            <td className="rounded-r-2xl p-3 whitespace-nowrap text-sg-muted">
                                                {change ? t("changedBy", { date: shortDate.format(change.createdAt), name: change.authorName }) : shortDate.format(r.updatedAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {pages > 1 && (
                    <nav aria-label={t("pages")} className="flex items-center justify-between gap-3 px-2 pt-1">
                        {page > 1 ? (
                            <Link href={pageHref(page - 1)} className={cn(outlineButton, "h-10 text-sm")}>
                                {t("prev")}
                            </Link>
                        ) : (
                            <span aria-hidden="true" className={cn(outlineButton, "h-10 text-sm opacity-40")}>
                                {t("prev")}
                            </span>
                        )}
                        <span className="text-sm font-semibold text-sg-muted">{t("page", { page, total: pages })}</span>
                        {page < pages ? (
                            <Link href={pageHref(page + 1)} className={cn(outlineButton, "h-10 text-sm")}>
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
        </AdminGlass>
    );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus, Search } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { coralButton } from "@/components/soft-glass/classes";
import {
    Figure,
    PageHeading,
    RequiredDocuments,
    caption,
    field,
    formatShortDate,
    inkButton,
    label,
    outlineButton,
    textLink,
} from "@/components/jobs/employer-ui";

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const t = await getTranslations("Employer.jobs");
    const q = (await searchParams).q?.trim() ?? "";

    const jobs = await db.job.findMany({
        where: { employerId: userId, ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}) },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            title: true,
            createdAt: true,
            requireResume: true,
            requireAadhar: true,
            requirePAN: true,
            _count: { select: { questions: { where: { archived: false } } } },
            interviews: { select: { status: true } },
        },
    });

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                title={t("title")}
                subtitle={t("subtitle")}
                actions={
                    <Link href="/dashboard/jobs/new" className={cn(coralButton, "h-12 px-[22px]")}>
                        <Plus className="size-5" aria-hidden="true" />
                        {t("newJob")}
                    </Link>
                }
            />

            <form role="search" action="/dashboard/jobs" className="relative max-w-[420px]">
                <Search className="pointer-events-none absolute top-3.5 left-4 size-5 text-sg-muted" aria-hidden="true" />
                <label htmlFor="jobs-search" className="sr-only">
                    {t("search")}
                </label>
                <input id="jobs-search" name="q" type="search" defaultValue={q} placeholder={t("search")} className={cn(field, "h-12 pl-12")} />
            </form>

            {jobs.length === 0 ? (
                <p className="rounded-[24px] border-2 border-dashed border-sg-field-border p-6 text-center text-sg-muted">
                    {q ? t("noMatch", { q }) : t("empty")}
                </p>
            ) : (
                <ul className="flex flex-col gap-3.5">
                    {jobs.map((job) => {
                        const done = job.interviews.filter((i) => i.status === "COMPLETED").length;
                        return (
                            <li key={job.id} className="sg-glass flex flex-wrap items-center gap-x-6 gap-y-3.5 rounded-[24px] p-5">
                                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                                    <Link
                                        href={`/dashboard/jobs/${job.id}`}
                                        className={cn(textLink, "self-start text-xl leading-7 whitespace-normal break-words")}
                                    >
                                        {job.title}
                                    </Link>
                                    <span className={caption}>
                                        {t("posted", { date: formatShortDate(job.createdAt), count: job._count.questions })}
                                    </span>
                                </div>
                                <div className="flex gap-6">
                                    <Figure value={job.interviews.length} label={t("invited")} />
                                    <Figure value={done} label={t("completed")} />
                                </div>
                                <div className="flex min-w-0 flex-[0_1_200px] flex-col gap-1">
                                    <span className={label}>{t("documents")}</span>
                                    <RequiredDocuments job={job} />
                                </div>
                                <div className="flex gap-1.5">
                                    <Link
                                        href={`/dashboard/jobs/${job.id}`}
                                        aria-label={t("viewAria", { title: job.title })}
                                        className={cn(inkButton, "h-10 px-4 text-sm font-semibold")}
                                    >
                                        {t("view")}
                                    </Link>
                                    <Link
                                        href={`/dashboard/jobs/${job.id}/edit`}
                                        aria-label={t("editAria", { title: job.title })}
                                        className={cn(outlineButton, "h-10 text-sm")}
                                    >
                                        {t("edit")}
                                    </Link>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/jobs/employer-ui";
import { RequirementsForm } from "@/components/jobs/requirements-form";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Employer.requirements");
    return { title: t("title") };
}

/** A job's Talent Match requirements (AIIN-192), from the approved "Job requirements" artboards. */
export default async function JobRequirementsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
    const [{ id }, { new: fresh }] = await Promise.all([params, searchParams]);
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Employer.requirements");

    const job = await db.job.findFirst({
        where: { id, employerId: userId, archivedAt: null },
        select: {
            id: true,
            title: true,
            status: true,
            requirementsConfirmedAt: true,
            mustHaveSkills: true,
            niceToHaveSkills: true,
            minYears: true,
            maxYears: true,
            location: true,
            workMode: true,
            salaryMin: true,
            salaryMax: true,
            maxNoticeDays: true,
        },
    });
    if (!job) notFound();

    const { id: jobId, title, status, requirementsConfirmedAt, ...saved } = job;
    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading back={{ href: `/dashboard/jobs/${jobId}`, label: title }} title={t("title")} subtitle={t("subtitle")} />
            <RequirementsForm
                jobId={jobId}
                eyebrow={fresh ? t("stepNew") : status === "DRAFT" ? t("draft") : t("open")}
                saved={saved}
                // Ask U straight away only when nothing has been confirmed yet (AC1)
                propose={!requirementsConfirmedAt && saved.mustHaveSkills.length === 0 && saved.niceToHaveSkills.length === 0}
                publish={status === "DRAFT" || status === "OPEN"}
            />
        </div>
    );
}

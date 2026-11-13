import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { driveJobs, driveTests, formValues } from "@/lib/drive-loaders";
import { PageHeading } from "@/components/jobs/employer-ui";
import { DriveForm } from "@/components/drives/drive-form";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Drives");
    return { title: t("editTitle") };
}

/** Edit a drive (AIIN-165). Only its employer can open it (AC8). */
export default async function EditDrivePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Drives");

    const drive = await db.drive.findFirst({
        where: { id, employerId: userId },
        select: {
            id: true,
            jobId: true,
            name: true,
            opensAt: true,
            closesAt: true,
            autoShortlist: true,
            interviewCutoff: true,
            aptitudeEnabled: true,
            aptitudeTestId: true,
            aptitudeCutoff: true,
            colleges: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, city: true, placementOfficerEmail: true } },
            _count: { select: { candidates: true } },
        },
    });
    if (!drive) notFound();
    const [jobs, tests] = await Promise.all([driveJobs(userId), driveTests(userId)]);

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading back={{ href: `/dashboard/drives/${drive.id}`, label: drive.name }} title={t("editTitle")} subtitle={t("formSubtitle")} />
            <DriveForm id={drive.id} jobs={jobs} tests={tests} locked={drive._count.candidates > 0} initial={formValues(drive)} />
        </div>
    );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeading } from "@/components/jobs/employer-ui";
import { ImportFlow } from "@/components/drives/import-flow";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("DriveImport");
    return { title: t("title") };
}

/** Invite a drive's candidates from a CSV (AIIN-166). Only the drive's employer can open it (AC9). */
export default async function DriveImportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const drive = await db.drive.findFirst({ where: { id, employerId: userId }, select: { id: true, name: true } });
    if (!drive) notFound();
    const t = await getTranslations("DriveImport");
    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading back={{ href: `/dashboard/drives/${drive.id}`, label: drive.name }} title={t("title")} subtitle={t("subtitle")} />
            <ImportFlow driveId={drive.id} />
        </div>
    );
}

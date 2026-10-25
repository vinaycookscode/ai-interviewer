import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EditJobForm } from "@/components/jobs/edit-job-form";
import { PageHeading } from "@/components/jobs/employer-ui";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    // Loaded only if the signed-in employer owns it.
    const job = await db.job.findFirst({
        where: { id, employerId: userId },
        select: {
            id: true,
            title: true,
            description: true,
            requireResume: true,
            requireAadhar: true,
            requirePAN: true,
            questions: { where: { archived: false }, orderBy: { createdAt: "asc" }, select: { id: true, text: true, type: true } },
        },
    });

    if (!job) notFound();

    const t = await getTranslations("Employer.form");

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading
                back={{ href: `/dashboard/jobs/${job.id}`, label: job.title }}
                title={t("editTitle", { title: job.title })}
                subtitle={t("subtitle")}
            />
            <EditJobForm jobId={job.id} initialData={job} />
        </div>
    );
}

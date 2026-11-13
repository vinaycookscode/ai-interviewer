import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { driveJobs } from "@/lib/drive-loaders";
import { PageHeading } from "@/components/jobs/employer-ui";
import { EmptyState } from "@/components/soft-glass/empty-state";
import { coralButton } from "@/components/soft-glass/classes";
import { DriveForm } from "@/components/drives/drive-form";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Drives");
    return { title: t("newTitle") };
}

/** A new drive, for one of the employer's jobs (AIIN-165). ?job= picks the job when coming from its page. */
export default async function NewDrivePage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
    const { job } = await searchParams;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("Drives");
    const jobs = await driveJobs(userId);
    const first = jobs.find((j) => j.id === job) ?? jobs.find((j) => j.questions > 0) ?? jobs[0];

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading back={{ href: "/dashboard/drives", label: t("back") }} title={t("newTitle")} subtitle={t("formSubtitle")} />
            {!first ? (
                <EmptyState
                    title={t("noJobs")}
                    action={
                        <Link href="/dashboard/jobs/new" className={cn(coralButton, "h-12 px-6")}>
                            {t("editJob")}
                        </Link>
                    }
                />
            ) : (
                <DriveForm
                    id={null}
                    jobs={jobs}
                    locked={false}
                    initial={{ jobId: first.id, name: "", opensAt: "", closesAt: "", colleges: [{ name: "" }], autoShortlist: false, interviewCutoff: "" }}
                />
            )}
        </div>
    );
}

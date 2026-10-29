import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { InviteCandidateDialog } from "@/components/interviews/invite-candidate-dialog";
import { BulkInviteDialog } from "@/components/interviews/bulk-invite-dialog";
import { CandidateList } from "@/components/jobs/candidate-list";
import { Chip, PageHeading, caption, formatShortDate, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    // Loaded only if the signed-in employer owns it.
    const job = await db.job.findFirst({
        where: { id, employerId: userId, archivedAt: null },
        select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            requireResume: true,
            requireAadhar: true,
            requirePAN: true,
            questions: { where: { archived: false }, orderBy: { createdAt: "asc" }, select: { id: true, text: true } },
            interviews: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    status: true,
                    score: true,
                    token: true,
                    resumeUrl: true,
                    aadhaarUrl: true,
                    panUrl: true,
                    createdAt: true,
                    candidate: { select: { name: true, email: true } },
                },
            },
        },
    });

    if (!job) notFound();

    const t = await getTranslations("Employer.job");
    const requirements = { requireResume: job.requireResume, requireAadhar: job.requireAadhar, requirePAN: job.requirePAN };
    const docs = [job.requireResume && t("docResume"), job.requirePAN && t("docPan"), job.requireAadhar && t("docAadhaar")].filter(Boolean) as string[];
    const completed = job.interviews.filter((i) => i.status === "COMPLETED").length;
    const rows = job.interviews.map((interview) => ({ ...interview, job: { title: job.title, ...requirements } }));
    const invitedEmails = job.interviews.map((i) => i.candidate.email.toLowerCase());

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-col gap-3">
                <PageHeading
                    back={{ href: "/dashboard/jobs", label: t("back") }}
                    title={job.title}
                    actions={
                        <>
                            <Link href={`/dashboard/jobs/${job.id}/edit`} className={cn(outlineButton, "h-12 px-[18px] text-[15px]")}>
                                {t("edit")}
                            </Link>
                            <BulkInviteDialog jobId={job.id} invitedEmails={invitedEmails} />
                            <InviteCandidateDialog jobId={job.id} />
                        </>
                    }
                />
                <div className="flex flex-wrap gap-2">
                    <Chip className="h-8 text-sm">{t("posted", { date: formatShortDate(job.createdAt) })}</Chip>
                    <Chip className="h-8 text-sm">{t("length", { count: job.questions.length, minutes: job.questions.length * 2 })}</Chip>
                    <Chip className="h-8 text-sm">
                        {docs.length > 0 ? t("docsRequired", { docs: new Intl.ListFormat("en-GB").format(docs) }) : t("noDocs")}
                    </Chip>
                </div>
            </div>

            <div className="flex flex-wrap items-start gap-6">
                <section aria-labelledby="candidates-title" className={cn(panel, "min-w-0 flex-[999_1_720px] gap-3.5 sm:p-6")}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 id="candidates-title" className={panelTitle}>
                            {t("candidates")}
                        </h2>
                        <span className={caption}>{t("invitedCompleted", { invited: job.interviews.length, completed })}</span>
                    </div>
                    {rows.length > 0 ? (
                        <CandidateList interviews={rows} />
                    ) : (
                        <p className="rounded-[18px] border-2 border-dashed border-sg-field-border p-5 text-center text-sg-muted">{t("noCandidates")}</p>
                    )}
                </section>

                <aside className="flex max-w-full min-w-[min(260px,100%)] flex-[1_1_300px] flex-col gap-4 lg:max-w-[400px]">
                    <section aria-labelledby="questions-title" className={panel}>
                        <h2 id="questions-title" className={panelTitle}>
                            {t("questions")}
                        </h2>
                        {job.questions.length > 0 ? (
                            <ol className="flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-[23px]">
                                {job.questions.map((question) => (
                                    <li key={question.id} className="break-words">
                                        {question.text}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sg-muted">{t("noQuestions")}</p>
                        )}
                    </section>

                    <details className={cn(panel, "group gap-0")}>
                        <summary className="cursor-pointer rounded-md font-display sg-soft text-[22px] leading-7 font-semibold focus-visible:ring-[3px] focus-visible:ring-sg-lavender/50 focus-visible:outline-none">
                            {t("description")}
                        </summary>
                        <p className="mt-4 text-[15px] leading-[23px] break-words whitespace-pre-wrap text-sg-muted">{job.description}</p>
                    </details>

                    <DeleteJobButton jobId={job.id} />
                </aside>
            </div>
        </div>
    );
}

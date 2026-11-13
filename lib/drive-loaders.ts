// Server-only loaders for the drive pages (AIIN-165): the employer's jobs for the form, and a drive scoped to its employer.
import { db } from "@/lib/db";
import { toIstInput, type DriveFormValues } from "@/lib/drives";

/** Jobs a drive can use: the employer's own, not archived, with how many interview questions each has. */
export async function driveJobs(employerId: string) {
    const jobs = await db.job.findMany({
        where: { employerId, archivedAt: null },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, _count: { select: { questions: { where: { archived: false } } } } },
    });
    return jobs.map((j) => ({ id: j.id, title: j.title, questions: j._count.questions }));
}

/** The form's values for an existing drive, built here so the client gets exactly what it shows. */
export function formValues(d: {
    jobId: string;
    name: string;
    opensAt: Date | null;
    closesAt: Date | null;
    autoShortlist: boolean;
    interviewCutoff: number | null;
    colleges: { id: string; name: string; city: string | null; placementOfficerEmail: string | null }[];
}): DriveFormValues {
    return {
        jobId: d.jobId,
        name: d.name,
        opensAt: toIstInput(d.opensAt),
        closesAt: toIstInput(d.closesAt),
        autoShortlist: d.autoShortlist,
        interviewCutoff: d.interviewCutoff === null ? "" : String(d.interviewCutoff),
        colleges: d.colleges.map((c) => ({ id: c.id, name: c.name, city: c.city ?? "", placementOfficerEmail: c.placementOfficerEmail ?? "" })),
    };
}

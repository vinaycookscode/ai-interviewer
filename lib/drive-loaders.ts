// Server-only loaders for the drive pages (AIIN-165): the employer's jobs for the form, and a drive scoped to its employer.
import { db } from "@/lib/db";
import { toIstInput, type DriveFormValues, type DriveTestOption } from "@/lib/drives";
import { readiness } from "@/lib/aptitude";

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
    aptitudeEnabled: boolean;
    aptitudeTestId: string | null;
    aptitudeCutoff: number | null;
    colleges: { id: string; name: string; city: string | null; placementOfficerEmail: string | null }[];
}): DriveFormValues {
    return {
        jobId: d.jobId,
        name: d.name,
        opensAt: toIstInput(d.opensAt),
        closesAt: toIstInput(d.closesAt),
        autoShortlist: d.autoShortlist,
        interviewCutoff: d.interviewCutoff === null ? "" : String(d.interviewCutoff),
        aptitudeEnabled: d.aptitudeEnabled,
        aptitudeTestId: d.aptitudeTestId ?? "",
        aptitudeCutoff: d.aptitudeCutoff === null ? "" : String(d.aptitudeCutoff),
        colleges: d.colleges.map((c) => ({ id: c.id, name: c.name, city: c.city ?? "", placementOfficerEmail: c.placementOfficerEmail ?? "" })),
    };
}


/** Aptitude tests a drive can use: ready-made ones and the employer's own, with whether each is ready (AIIN-169, AIIN-226). */
export async function driveTests(employerId: string): Promise<DriveTestOption[]> {
    const tests = await db.aptitudeTest.findMany({
        where: { archivedAt: null, OR: [{ ownerId: null }, { ownerId: employerId }] },
        orderBy: [{ ownerId: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        select: { id: true, name: true, durationMinutes: true, ownerId: true, sections: { select: { id: true, name: true, askCount: true } } },
    });
    if (!tests.length) return [];
    const counts = await db.aptitudeQuestion.groupBy({
        by: ["sectionId"],
        where: { testId: { in: tests.map((t) => t.id) }, checked: true, retiredAt: null },
        _count: { _all: true },
    });
    const checked = new Map(counts.map((c) => [c.sectionId, c._count._all]));
    return tests.map((t) => {
        const r = readiness(t.sections, checked);
        return { id: t.id, name: t.name, minutes: t.durationMinutes, questions: r.total, readyMade: t.ownerId === null, ready: r.ready };
    });
}

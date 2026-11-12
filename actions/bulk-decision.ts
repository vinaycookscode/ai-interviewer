"use server";

import { syncDecision } from "@/lib/application-sync";

import { revalidatePath } from "next/cache";
import { HiringDecision } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseFilters } from "@/lib/candidate-filters";
import { rankingWhere } from "@/lib/candidate-ranking";
import { emailsFor } from "@/lib/decision-email";
import { sendDecisionEmails } from "@/lib/decision-email-send";

/** At most this many in one go (AC8): narrow the filters for more. */
const LIMIT = 500;
const NOTE_LIMIT = 1000;

type Person = { id: string; name: string };

export type BulkResult =
    | {
          ok: true;
          updated: number;
          emailed: number;
          /** Already had this decision: nothing written, nothing sent (AC7). */
          unchanged: number;
          /** Not finished yet (AC3). */
          unfinished: Person[];
          /** Shortlisting needs their strong integrity concerns reviewed first (AIIN-178). */
          concerns: Person[];
          /** Saved, but the email didn't go (AC5). */
          notEmailed: (Person & { email: string })[];
      }
    | { error: "notFound" | "limit" | "invalid" };

async function employer() {
    const session = await auth();
    const user = session?.user;
    return user?.id && user.role === "EMPLOYER" ? user.id : null;
}

/**
 * Shortlist, hold or reject several of a job's candidates at once (AIIN-159), optionally emailing them. Either picked
 * ids or every candidate matching the ranked list's filters (`query`, AC6). One id that isn't the employer's refuses
 * the whole call (AC4). Decisions are saved together; emails go after, and a failed email never undoes a decision.
 */
export async function bulkSetInterviewDecision(input: {
    jobId: string;
    ids?: string[];
    query?: string;
    decision: HiringDecision;
    note?: string;
    notify?: boolean;
}): Promise<BulkResult> {
    const userId = await employer();
    if (!userId || !input || typeof input.jobId !== "string") return { error: "notFound" };
    if (!Object.values(HiringDecision).includes(input.decision) || input.decision === "UNDECIDED") return { error: "invalid" };
    const note = typeof input.note === "string" ? input.note.trim() || null : null;
    if (note && note.length > NOTE_LIMIT) return { error: "invalid" };

    const job = await db.job.findFirst({ where: { id: input.jobId, employerId: userId }, select: { id: true, title: true, employer: { select: { name: true, email: true } } } });
    if (!job) return { error: "notFound" };

    let ids: string[];
    if (typeof input.query === "string") {
        const filters = parseFilters(Object.fromEntries(new URLSearchParams(input.query)));
        ids = (await db.interview.findMany({ where: rankingWhere(job.id, filters), select: { id: true }, take: LIMIT + 1 })).map((i) => i.id);
    } else if (Array.isArray(input.ids) && input.ids.every((id) => typeof id === "string")) {
        ids = [...new Set(input.ids)];
    } else return { error: "invalid" };
    if (ids.length === 0) return { error: "invalid" };
    if (ids.length > LIMIT) return { error: "limit" };

    const interviews = await db.interview.findMany({
        where: { id: { in: ids }, job: { employerId: userId } },
        select: { id: true, jobId: true, status: true, decision: true, integrityVerdict: true, integrityReviewOutcome: true, candidate: { select: { name: true, email: true } } },
    });
    // Every id must be this employer's, on this job: otherwise nothing is written or sent (AC4)
    if (interviews.length !== ids.length || interviews.some((i) => i.jobId !== job.id)) return { error: "notFound" };

    const person = (i: (typeof interviews)[number]) => ({ id: i.id, name: i.candidate.name || i.candidate.email });
    const unfinished = interviews.filter((i) => i.status !== "COMPLETED");
    const finished = interviews.filter((i) => i.status === "COMPLETED");
    const unchanged = finished.filter((i) => i.decision === input.decision);
    const concerns = finished.filter(
        (i) => i.decision !== input.decision && input.decision === "SHORTLISTED" && i.integrityVerdict === "STRONG_CONCERNS" && i.integrityReviewOutcome !== "NO_ISSUE"
    );
    const blocked = new Set([...unchanged, ...concerns].map((i) => i.id));
    const change = finished.filter((i) => !blocked.has(i.id));

    if (change.length) {
        await db.$transaction([
            db.interview.updateMany({ where: { id: { in: change.map((i) => i.id) } }, data: { decision: input.decision, decisionAt: new Date(), decisionById: userId } }),
            db.interviewDecisionEvent.createMany({
                data: change.map((i) => ({ interviewId: i.id, from: i.decision, to: input.decision, note, byUserId: userId, source: "BULK" as const })),
            }),
        ]);
        // The applications hold the outcome (AIIN-195)
        await syncDecision(change.map((i) => i.id), input.decision, userId, note ?? null);
    }

    let notEmailed: (Person & { email: string })[] = [];
    let emailed = 0;
    if (input.notify === true && emailsFor(input.decision) && change.length) {
        const failed = new Set(
            await sendDecisionEmails(input.decision, job.title, job.employer, change.map((i) => ({ interviewId: i.id, name: i.candidate.name, email: i.candidate.email })))
        );
        notEmailed = change.filter((i) => failed.has(i.id)).map((i) => ({ ...person(i), email: i.candidate.email }));
        emailed = change.length - failed.size;
    }

    revalidatePath(`/dashboard/jobs/${job.id}`);
    return { ok: true, updated: change.length, emailed, unchanged: unchanged.length, unfinished: unfinished.map(person), concerns: concerns.map(person), notEmailed };
}

/** Send again the decision emails that failed (AC5): only the employer's, only for their current decision. */
export async function retryDecisionEmails(jobId: string, ids: string[]): Promise<{ ok: true; notEmailed: (Person & { email: string })[] } | { error: "notFound" }> {
    const userId = await employer();
    if (!userId || typeof jobId !== "string" || !Array.isArray(ids) || ids.length === 0 || ids.length > LIMIT) return { error: "notFound" };
    const job = await db.job.findFirst({ where: { id: jobId, employerId: userId }, select: { title: true, employer: { select: { name: true, email: true } } } });
    if (!job) return { error: "notFound" };
    const interviews = await db.interview.findMany({ where: { id: { in: ids }, jobId, status: "COMPLETED" }, select: { id: true, decision: true, candidate: { select: { name: true, email: true } } } });
    if (interviews.length !== new Set(ids).size) return { error: "notFound" };

    const notEmailed: (Person & { email: string })[] = [];
    for (const decision of ["SHORTLISTED", "REJECTED"] as const) {
        const group = interviews.filter((i) => i.decision === decision);
        if (!group.length) continue;
        const failed = new Set(await sendDecisionEmails(decision, job.title, job.employer, group.map((i) => ({ interviewId: i.id, name: i.candidate.name, email: i.candidate.email }))));
        notEmailed.push(...group.filter((i) => failed.has(i.id)).map((i) => ({ id: i.id, name: i.candidate.name || i.candidate.email, email: i.candidate.email })));
    }
    return { ok: true, notEmailed };
}

"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { Resend } from "resend";
import { env } from "@/env";
import { APP_URL } from "@/lib/email";
import { EMAILED, applicationEmail } from "@/lib/application-email";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { STAGES, canMove, cleanNote, type Stage } from "@/lib/applications";

type Result = { ok: true } | { error: "notFound" | "invalid" | "reasonRequired" };

/** The signed-in employer's own application (AC4: anyone else's is not found, and nothing changes). */
async function ownApplication(id: unknown) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "EMPLOYER" || typeof id !== "string") return null;
    const app = await db.application.findFirst({ where: { id, employerId: userId }, select: { id: true, jobId: true, stage: true } });
    return app ? { ...app, userId } : null;
}

const refresh = (jobId: string, id: string) => {
    revalidatePath(`/dashboard/jobs/${jobId}/applications`);
    revalidatePath(`/dashboard/jobs/${jobId}/applications/${id}`);
};

/** Move an application, with an optional note; Rejected needs a reason (AC2), kept from the candidate. */
export async function moveApplication(id: string, to: string, note?: string): Promise<Result> {
    const app = await ownApplication(id);
    if (!app) return { error: "notFound" };
    const text = cleanNote(note);
    if (!(STAGES as readonly string[]).includes(to) || text === undefined || !canMove(app.stage as Stage, to as Stage)) return { error: "invalid" };
    if (to === "REJECTED" && !text) return { error: "reasonRequired" };
    await db.$transaction([
        db.application.update({
            where: { id: app.id },
            data: { stage: to as Stage, stageChangedAt: new Date(), onHold: false, rejectionReason: to === "REJECTED" ? text : null },
        }),
        db.applicationEvent.create({ data: { applicationId: app.id, actorId: app.userId, fromStage: app.stage, toStage: to as Stage, note: text } }),
    ]);
    refresh(app.jobId, app.id);
    // The candidate hears about it only if they turned application emails on (AIIN-197)
    if (EMAILED.includes(to as Stage)) after(() => emailCandidate(app.id, to as Stage));
    return { ok: true };
}

/** Email the candidate about a move, if they asked for it. Never the employer's note or reason. Never throws. */
async function emailCandidate(id: string, stage: Stage) {
    try {
        const a = await db.application.findUnique({
            where: { id },
            select: {
                candidate: { select: { email: true, name: true, applicationEmails: true } },
                job: { select: { title: true, employer: { select: { name: true } } } },
            },
        });
        if (!a?.candidate.applicationEmails) return;
        const company = a.job.employer.name?.trim() || "The employer";
        const mail = applicationEmail({ name: a.candidate.name, job: a.job.title, company, stage, appUrl: APP_URL });
        if (!env.RESEND_API_KEY) return console.log(`Application email: Resend isn't configured; would send "${mail.subject}"`);
        const { error } = await new Resend(env.RESEND_API_KEY).emails.send({ from: "Get Back To U <noreply@getbacktou.com>", to: a.candidate.email, ...mail });
        if (error) console.error("Application email failed:", error);
    } catch (error) {
        console.error("Application email failed:", error);
    }
}

/** A call note or any note for the team, in the history without a move. */
export async function addApplicationNote(id: string, note: string): Promise<Result> {
    const app = await ownApplication(id);
    if (!app) return { error: "notFound" };
    const text = cleanNote(note);
    if (!text) return { error: "invalid" };
    await db.applicationEvent.create({ data: { applicationId: app.id, actorId: app.userId, note: text } });
    refresh(app.jobId, app.id);
    return { ok: true };
}

/** Put on hold, or take off hold. The stage stays as it is. */
export async function setApplicationHold(id: string, onHold: boolean): Promise<Result> {
    const app = await ownApplication(id);
    if (!app) return { error: "notFound" };
    if (typeof onHold !== "boolean") return { error: "invalid" };
    await db.$transaction([
        db.application.update({ where: { id: app.id }, data: { onHold } }),
        db.applicationEvent.create({ data: { applicationId: app.id, actorId: app.userId, note: onHold ? "Put on hold" : "Taken off hold" } }),
    ]);
    refresh(app.jobId, app.id);
    return { ok: true };
}

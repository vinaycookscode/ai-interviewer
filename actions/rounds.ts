"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { Resend } from "resend";
import { env } from "@/env";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { APP_URL } from "@/lib/email";
import { CLOSED, type Stage } from "@/lib/applications";
import { revealsCandidate } from "@/lib/invitations";
import { DURATIONS, ROUND_NAME_MAX, cleanMeetingLink, cleanText, roundEmail, roundIcs, validStart, type RoundEmailKind } from "@/lib/rounds";
import { inviteCandidate } from "@/actions/interview";

type Result = { ok: true } | { error: "notFound" | "invalid" | "closed" | "aiFailed" };

/** The signed-in employer's own application, open and revealed. Anyone else's is not found. */
async function ownOpenApplication(id: unknown) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "EMPLOYER" || typeof id !== "string") return null;
    const app = await db.application.findFirst({
        where: { id, employerId: userId },
        select: { id: true, jobId: true, stage: true, candidateId: true },
    });
    if (!app) return null;
    return { ...app, stage: app.stage as Stage, userId };
}

const usable = (stage: Stage) => revealsCandidate(stage) && !CLOSED.includes(stage);

/** Booking a round moves an application that's earlier than Interviewing to Interviewing, with a history line. */
function toInterviewing(app: { id: string; stage: Stage; userId: string }, note: string) {
    if (app.stage !== "APPLIED" && app.stage !== "SCREENING") return [];
    return [
        db.application.update({
            where: { id: app.id },
            data: { stage: "INTERVIEW", stageChangedAt: new Date(), onHold: false },
        }),
        db.applicationEvent.create({
            data: {
                applicationId: app.id,
                actorId: app.userId,
                fromStage: app.stage,
                toStage: "INTERVIEW",
                note,
            },
        }),
    ];
}

const refresh = (jobId: string, id: string) => {
    revalidatePath(`/dashboard/jobs/${jobId}/applications`);
    revalidatePath(`/dashboard/jobs/${jobId}/applications/${id}`);
    revalidatePath("/candidate/applications");
};

/** AC1: an AI round sends today's interview invite and link, and moves the application to Interviewing. */
export async function scheduleAiRound(id: string, startsAt: string): Promise<Result> {
    const app = await ownOpenApplication(id);
    if (!app) return { error: "notFound" };
    if (!usable(app.stage)) return { error: "closed" };
    const start = validStart(startsAt, new Date());
    if (!start) return { error: "invalid" };
    const person = await db.user.findUnique({
        where: { id: app.candidateId },
        select: { email: true, name: true },
    });
    if (!person) return { error: "notFound" };
    const sent = await inviteCandidate({
        jobId: app.jobId,
        candidateName: person.name ?? "",
        candidateEmail: person.email,
        scheduledTime: start.toISOString(),
    });
    if (!sent.success) return { error: "aiFailed" };
    const moves = toInterviewing(app, "AI interview scheduled");
    if (moves.length) await db.$transaction(moves);
    refresh(app.jobId, app.id);
    return { ok: true };
}

interface RoundInput {
    roundName: string;
    startsAt: string;
    durationMins: number;
    interviewer?: string;
    meetingLink: string;
}

function cleanRound(input: RoundInput) {
    if (!input || typeof input !== "object") return null;
    const roundName = cleanText(input.roundName, ROUND_NAME_MAX);
    const interviewer = cleanText(input.interviewer, ROUND_NAME_MAX);
    const meetingLink = cleanMeetingLink(input.meetingLink);
    const startsAt = validStart(input.startsAt, new Date());
    const durationMins = (DURATIONS as readonly number[]).includes(input.durationMins) ? input.durationMins : undefined;
    if (!roundName || interviewer === undefined || !meetingLink || !startsAt || !durationMins) return null;
    return { roundName, interviewer, meetingLink, startsAt, durationMins };
}

/** AC2: a human round with a date, time, interviewer and link; the candidate gets an email with a calendar invite. */
export async function addHumanRound(id: string, input: RoundInput): Promise<Result> {
    const app = await ownOpenApplication(id);
    if (!app) return { error: "notFound" };
    if (!usable(app.stage)) return { error: "closed" };
    const round = cleanRound(input);
    if (!round) return { error: "invalid" };
    const [created] = await db.$transaction([
        db.humanRound.create({
            data: { applicationId: app.id, createdById: app.userId, ...round },
            select: { id: true },
        }),
        ...toInterviewing(app, `${round.roundName} scheduled`),
    ]);
    refresh(app.jobId, app.id);
    after(() => emailRound(created.id, "scheduled"));
    return { ok: true };
}

/** The employer's own round on an application they can still act on. */
async function ownRound(roundId: unknown) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || session.user.role !== "EMPLOYER" || typeof roundId !== "string") return null;
    const round = await db.humanRound.findFirst({
        where: { id: roundId, application: { employerId: userId } },
        select: {
            id: true,
            cancelledAt: true,
            sequence: true,
            application: { select: { id: true, jobId: true, stage: true } },
        },
    });
    return round ? { ...round, userId } : null;
}

/** A new time or link. The calendar invite is sent again with a higher sequence, so calendars replace the old one. */
export async function rescheduleHumanRound(roundId: string, input: RoundInput): Promise<Result> {
    const round = await ownRound(roundId);
    if (!round) return { error: "notFound" };
    if (round.cancelledAt || !usable(round.application.stage as Stage)) return { error: "closed" };
    const next = cleanRound(input);
    if (!next) return { error: "invalid" };
    await db.humanRound.update({
        where: { id: round.id },
        data: { ...next, outcome: null, sequence: { increment: 1 } },
    });
    refresh(round.application.jobId, round.application.id);
    after(() => emailRound(round.id, "moved"));
    return { ok: true };
}

/** Cancel: the round stays in the list, struck through, and calendars remove it. */
export async function cancelHumanRound(roundId: string): Promise<Result> {
    const round = await ownRound(roundId);
    if (!round) return { error: "notFound" };
    if (round.cancelledAt) return { ok: true };
    await db.humanRound.update({
        where: { id: round.id },
        data: { cancelledAt: new Date(), sequence: { increment: 1 } },
    });
    refresh(round.application.jobId, round.application.id);
    after(() => emailRound(round.id, "cancelled"));
    return { ok: true };
}

const OUTCOMES = ["PASSED", "FAILED", "NO_SHOW"] as const;

/** AC3: each round's outcome, kept from the candidate. Clearing it (null) is allowed. */
export async function setRoundOutcome(roundId: string, outcome: string | null): Promise<Result> {
    const round = await ownRound(roundId);
    if (!round) return { error: "notFound" };
    if (round.cancelledAt) return { error: "closed" };
    if (outcome !== null && !(OUTCOMES as readonly string[]).includes(outcome)) return { error: "invalid" };
    await db.humanRound.update({
        where: { id: round.id },
        data: { outcome: outcome as (typeof OUTCOMES)[number] | null },
    });
    refresh(round.application.jobId, round.application.id);
    return { ok: true };
}

/** Email the candidate the round with its calendar invite. Always sent: it's a meeting they must attend. Never throws. */
async function emailRound(roundId: string, kind: RoundEmailKind) {
    try {
        const r = await db.humanRound.findUnique({
            where: { id: roundId },
            select: {
                id: true,
                roundName: true,
                startsAt: true,
                durationMins: true,
                interviewer: true,
                meetingLink: true,
                sequence: true,
                application: {
                    select: {
                        candidate: { select: { email: true, name: true } },
                        job: {
                            select: { title: true, employer: { select: { name: true } } },
                        },
                    },
                },
            },
        });
        if (!r) return;
        const company = r.application.job.employer.name?.trim() || "The employer";
        const mail = roundEmail({
            kind,
            name: r.application.candidate.name,
            round: r.roundName,
            job: r.application.job.title,
            company,
            start: r.startsAt,
            minutes: r.durationMins,
            interviewer: r.interviewer,
            link: r.meetingLink,
            appUrl: APP_URL,
        });
        const ics = roundIcs({
            uid: r.id,
            sequence: r.sequence,
            title: `${r.roundName}: ${r.application.job.title}, ${company}`,
            description: r.interviewer ? `With ${r.interviewer}` : r.roundName,
            start: r.startsAt,
            minutes: r.durationMins,
            link: r.meetingLink,
            cancelled: kind === "cancelled",
            now: new Date(),
            organizer: "noreply@getbacktou.com",
            attendee: r.application.candidate.email,
        });
        if (!env.RESEND_API_KEY) return console.log(`Round email: Resend isn't configured; would send "${mail.subject}"`);
        const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
            from: "Get Back To U <noreply@getbacktou.com>",
            to: r.application.candidate.email,
            ...mail,
            attachments: [
                {
                    filename: "invite.ics",
                    content: Buffer.from(ics).toString("base64"),
                    contentType: `text/calendar; method=${kind === "cancelled" ? "CANCEL" : "REQUEST"}`,
                },
            ],
        });
        if (error) console.error("Round email failed:", error);
    } catch (error) {
        console.error("Round email failed:", error);
    }
}

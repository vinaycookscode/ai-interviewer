// Gathers each candidate's week, claims it in the sent log and sends the reports in batches (AIIN-103).
import { Resend } from "resend";
import { db } from "@/lib/db";
import { env } from "@/env";
import { APP_URL } from "@/lib/email";
import { liveStreak } from "@/lib/streak";
import { buildReport, lastWeek, type Week, type WeekActivity } from "@/lib/weekly-report/report";
import { renderWeeklyEmail } from "@/lib/weekly-report/email";
import { unsubscribeQuery } from "@/lib/weekly-report/unsubscribe-token";

const DAY_MS = 24 * 60 * 60 * 1000;
const BATCH = 100;
const FROM = "Get Back To U <noreply@getbacktou.com>";

const dayMonth = (d: Date) => d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

/** Candidates who did anything from 3 weeks before the reported week until its end. */
async function recentlyActive(from: Date, to: Date) {
    const range = { gte: from, lt: to };
    const [practice, tasks, cards] = await Promise.all([
        db.mockInterview.findMany({ where: { createdAt: range }, select: { userId: true, createdAt: true } }),
        db.taskCompletion.findMany({ where: { completedAt: range }, select: { completedAt: true, enrollment: { select: { userId: true } } } }),
        db.flashcardProgress.findMany({ where: { lastReview: range }, select: { userId: true, lastReview: true } }),
    ]);
    const seen = new Map<string, Date[]>();
    const add = (userId: string, at: Date | null) => at && seen.set(userId, [...(seen.get(userId) ?? []), at]);
    practice.forEach((p) => add(p.userId, p.createdAt));
    tasks.forEach((t) => add(t.enrollment.userId, t.completedAt));
    cards.forEach((c) => add(c.userId, c.lastReview));
    return seen;
}

async function weekFor(userId: string, week: Week, activity: Date[], activeBefore: boolean): Promise<WeekActivity> {
    const range = { gte: week.start, lt: week.end };
    const [practice, previous, flashcards, enrollment] = await Promise.all([
        db.mockInterview.findMany({
            where: { userId, createdAt: range },
            orderBy: { createdAt: "desc" },
            select: { score: true, role: true, answers: { where: { score: { not: null } }, select: { question: true, score: true } } },
        }),
        db.mockInterview.aggregate({ where: { userId, createdAt: { gte: new Date(week.start.getTime() - 7 * DAY_MS), lt: week.start }, score: { not: null } }, _avg: { score: true } }),
        db.flashcardProgress.count({ where: { userId, lastReview: range } }),
        db.programEnrollment.findFirst({
            where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
            orderBy: { updatedAt: "desc" },
            select: { streak: true, lastActiveAt: true, status: true },
        }),
    ]);
    return {
        practice: practice.map((p) => ({ score: p.score, role: p.role })),
        previousAverage: previous._avg.score,
        answers: practice.flatMap((p) => p.answers.map((a) => ({ question: a.question, score: a.score as number }))),
        activity,
        flashcardsReviewed: flashcards,
        plan: enrollment
            ? { streak: liveStreak(enrollment.streak, enrollment.lastActiveAt, enrollment.status === "PAUSED", week.end), paused: enrollment.status === "PAUSED" }
            : null,
        activeBefore,
    };
}

export interface SendResult {
    week: string;
    sent: number;
    skipped: number;
    failed: number;
}

export async function sendWeeklyReports(now = new Date()): Promise<SendResult> {
    const week = lastWeek(now);
    const windowStart = new Date(week.start.getTime() - 21 * DAY_MS);
    const active = await recentlyActive(windowStart, week.end);

    // Candidates only, who haven't opted out and haven't had this week's report
    const users = await db.user.findMany({
        where: {
            id: { in: [...active.keys()] },
            role: "CANDIDATE",
            weeklyReportEmails: true,
            password: { not: null },
            weeklyReports: { none: { weekStart: new Date(week.monday) } },
        },
        select: { id: true, name: true, email: true },
    });

    const label = `${dayMonth(week.start)} to ${dayMonth(new Date(week.end.getTime() - 1))}`;
    const outbox: { userId: string; to: string; subject: string; html: string; text: string; unsubscribe: string }[] = [];
    let skipped = 0;
    for (const user of users) {
        const times = active.get(user.id) ?? [];
        const thisWeek = times.filter((t) => t >= week.start && t < week.end);
        const report = buildReport(await weekFor(user.id, week, thisWeek, times.some((t) => t < week.start)));
        if (!report) {
            skipped++;
            continue;
        }
        // Claim the week first: a second run, or one running at the same time, skips this user
        try {
            await db.weeklyReport.create({ data: { userId: user.id, weekStart: new Date(week.monday), kind: report.kind } });
        } catch {
            skipped++;
            continue;
        }
        const unsubscribe = `${APP_URL}/unsubscribe?${unsubscribeQuery(user.id)}`;
        outbox.push({ userId: user.id, to: user.email, unsubscribe, ...renderWeeklyEmail(report, user.name, user.email, label, { app: APP_URL, unsubscribe }) });
    }

    const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < outbox.length; i += BATCH) {
        const batch = outbox.slice(i, i + BATCH);
        if (!resend) {
            console.log(`Weekly report: Resend isn't configured; would send ${batch.length} emails`);
            sent += batch.length;
            continue;
        }
        const { error } = await resend.batch.send(
            batch.map((m) => ({
                from: FROM,
                to: m.to,
                subject: m.subject,
                html: m.html,
                text: m.text,
                headers: {
                    "List-Unsubscribe": `<${m.unsubscribe.replace("/unsubscribe?", "/api/unsubscribe?")}>`,
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                },
            }))
        );
        if (error) {
            // Release the claims so the next run retries them
            console.error("Weekly report batch failed:", error);
            await db.weeklyReport.deleteMany({ where: { userId: { in: batch.map((m) => m.userId) }, weekStart: new Date(week.monday) } });
            failed += batch.length;
        } else {
            sent += batch.length;
        }
    }
    return { week: week.monday, sent, skipped, failed };
}

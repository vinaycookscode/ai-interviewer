// Deleting a candidate's account and data (AIIN-58, ADR 2026-11-02-deleting-an-account). Server only, no access
// checks: callers check who may delete. Interviews done for employers are kept, anonymised, under one placeholder.
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { deleteR2Prefix } from "@/lib/r2";
import { DELETED_CANDIDATE_EMAIL, DELETED_CANDIDATE_NAME } from "@/lib/deleted-candidate";

/**
 * The placeholder that anonymised interviews belong to. Its password is random and never stored anywhere, and its
 * interviews have no token, so nobody can sign in as it or claim it by registering.
 */
async function deletedCandidateId(): Promise<string> {
    const existing = await db.user.findUnique({ where: { email: DELETED_CANDIDATE_EMAIL }, select: { id: true } });
    if (existing) return existing.id;
    const created = await db.user.create({
        data: {
            email: DELETED_CANDIDATE_EMAIL,
            name: DELETED_CANDIDATE_NAME,
            role: "CANDIDATE",
            password: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
            weeklyReportEmails: false,
        },
        select: { id: true },
    });
    return created.id;
}

/**
 * Deletes the account and everything that is the candidate's own. Interviews they did for employers stay with the
 * employer as "Deleted candidate": the score, verdict, the employer's decision and reviews. Answers, transcripts,
 * documents, the AI profile, integrity events and the consent record go. Then their files are removed from storage.
 */
export async function deleteAccount(userId: string): Promise<{ files: number }> {
    const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user || user.email === DELETED_CANDIDATE_EMAIL) throw new Error("No such account");

    const placeholder = await deletedCandidateId();
    const interviewIds = (await db.interview.findMany({ where: { candidateId: userId }, select: { id: true } })).map((i) => i.id);
    const ofInterviews = { interviewId: { in: interviewIds } };

    await db.$transaction([
        db.answer.deleteMany({ where: ofInterviews }),
        db.proctoringEvent.deleteMany({ where: ofInterviews }),
        db.personalityProfile.deleteMany({ where: ofInterviews }),
        db.interviewConsent.deleteMany({ where: ofInterviews }),
        db.interview.updateMany({
            where: { id: { in: interviewIds } },
            data: { candidateId: placeholder, token: null, resumeUrl: null, aadhaarUrl: null, panUrl: null, feedback: null, consentDeclinedAt: null },
        }),
        db.mockAnswer.deleteMany({ where: { mockInterview: { userId } } }),
        db.mockInterview.deleteMany({ where: { userId } }),
        // Tables that name the user without a foreign key
        db.flashcardProgress.deleteMany({ where: { userId } }),
        db.flashcardDeck.deleteMany({ where: { userId } }),
        db.usageRecord.deleteMany({ where: { userId } }),
        db.squadActivity.deleteMany({ where: { userId } }),
        db.feedback.deleteMany({ where: { userId } }),
        db.passwordResetToken.deleteMany({ where: { email: user.email } }),
        // Everything else cascades from the user
        db.user.delete({ where: { id: userId } }),
    ]);

    // After the data is gone: a storage failure is logged, never leaves a half-deleted account
    const results = await Promise.allSettled([deleteR2Prefix(`profiles/${userId}/`), ...interviewIds.map((id) => deleteR2Prefix(`documents/${id}/`))]);
    let files = 0;
    for (const r of results) {
        if (r.status === "fulfilled") files += r.value;
        else console.error("Couldn't delete stored files for a deleted account:", r.reason);
    }
    return { files };
}

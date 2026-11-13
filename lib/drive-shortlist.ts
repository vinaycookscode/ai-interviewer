// Applying a drive's auto-shortlist (AIIN-171). Server only; callers have checked ownership where a person acts.
import { db } from "@/lib/db";
import { autoDecision } from "@/lib/auto-shortlist";
import { syncDecision } from "@/lib/application-sync";

/** Decide one scored interview by its drive's rule, if the rule applies. Recorded with source AUTO_CUTOFF and no author. */
export async function autoShortlist(interviewId: string): Promise<boolean> {
    const iv = await db.interview.findUnique({
        where: { id: interviewId },
        select: { score: true, decision: true, integrityVerdict: true, drive: { select: { autoShortlist: true, interviewCutoff: true, employerId: true } } },
    });
    if (!iv) return false;
    const d = autoDecision({
        inDrive: !!iv.drive,
        enabled: !!iv.drive?.autoShortlist,
        cutoff: iv.drive?.interviewCutoff ?? null,
        score: iv.score,
        decision: iv.decision,
        strongConcerns: iv.integrityVerdict === "STRONG_CONCERNS",
    });
    if (!d || !iv.drive) return false;
    // Only while still undecided, so a person deciding at the same moment wins (AC4)
    const n = await db.interview.updateMany({ where: { id: interviewId, decision: "UNDECIDED" }, data: { decision: d.to, decisionAt: new Date(), decisionById: null } });
    if (n.count !== 1) return false;
    await db.interviewDecisionEvent.create({ data: { interviewId, from: "UNDECIDED", to: d.to, note: d.note, source: "AUTO_CUTOFF" } });
    await syncDecision([interviewId], d.to, iv.drive.employerId, d.note);
    return true;
}

/** "Apply the new cutoff to undecided candidates" (AC5): only scored, undecided interviews of this drive are touched. */
export async function applyCutoffToUndecided(driveId: string): Promise<number> {
    const ids = await db.interview.findMany({ where: { driveId, decision: "UNDECIDED", score: { not: null } }, select: { id: true } });
    let n = 0;
    for (const { id } of ids) if (await autoShortlist(id)) n++;
    return n;
}

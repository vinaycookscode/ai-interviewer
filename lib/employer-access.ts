import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * The interview, if the signed-in user is the employer who owns its job; otherwise null, so callers answer
 * "not found" and reveal nothing about other employers' interviews. Shared by the shortlist actions (AIIN-157).
 */
export async function requireEmployerInterview(interviewId: string) {
    const session = await auth();
    const user = session?.user;
    if (!user?.id || user.role !== "EMPLOYER") return null;

    const interview = await db.interview.findFirst({
        where: { id: interviewId, job: { employerId: user.id } },
        select: { id: true, status: true, decision: true, jobId: true },
    });
    return interview ? { interview, userId: user.id } : null;
}

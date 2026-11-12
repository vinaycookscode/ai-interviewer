import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getFromR2 } from "@/lib/r2";
import { objectKey } from "@/lib/storage-key";

/**
 * Serve a private document after checking who is asking.
 * Access is decided from the object key, never from a URL the client stored:
 *   profiles/<userId>/...       → that user, or an admin
 *   documents/<interviewId>/... → the interview's candidate, the job's employer, or an admin
 */
async function canRead(userId: string, isAdmin: boolean, key: string[]): Promise<boolean> {
    if (isAdmin) return true;

    const [area, ownerId] = key;
    if (area === "profiles") return ownerId === userId;

    if (area === "documents") {
        const interview = await db.interview.findUnique({
            where: { id: ownerId },
            select: { candidateId: true, job: { select: { employerId: true } } },
        });
        return interview !== null && (interview.candidateId === userId || interview.job.employerId === userId);
    }

    return false;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await params;
    const notFound = NextResponse.json({ error: "Not found" }, { status: 404 });

    // Each decoded segment is checked, so "..%2Fu1" (arriving as "../u1") can't be authorized as one folder
    // and then resolved into another by the storage client (AIIN-216).
    const objectPath = objectKey(key);
    if (!objectPath) return notFound;

    if (!(await canRead(session.user.id, session.user.role === "ADMIN", key))) {
        return notFound;
    }

    try {
        const file = await getFromR2(objectPath);
        if (!file) return notFound;

        return new NextResponse(Buffer.from(file.body), {
            headers: {
                "Content-Type": file.contentType,
                "Content-Disposition": "inline",
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (error) {
        console.error("File read error:", error);
        return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
    }
}

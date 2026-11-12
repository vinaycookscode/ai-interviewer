import { auth } from "@/auth";
import { db } from "@/lib/db";
import { APP_URL } from "@/lib/email";
import { parseFilters } from "@/lib/candidate-filters";
import { RANKING_ORDER, rankOfAll, rankingWhere } from "@/lib/candidate-ranking";
import { CSV_BOM, CSV_HEADER, attachmentHeader, csvRow, exportFileName, istDateTime } from "@/lib/candidate-csv";

const BATCH = 500;
const DECISION: Record<string, string> = { UNDECIDED: "Undecided", SHORTLISTED: "Shortlisted", ON_HOLD: "On hold", REJECTED: "Rejected" };
const languages = new Intl.DisplayNames(["en"], { type: "language" });
const language = (code: string) => {
    try {
        return languages.of(code) ?? code;
    } catch {
        return code;
    }
};

/**
 * A job's ranked candidates as CSV (AIIN-162): exactly what the list's filters and sort show, every page, streamed in
 * batches so a large job starts downloading at once (AC5). Only the job's employer gets it; anyone else gets not-found (AC4).
 * No documents, transcripts or integrity evidence.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const userId = session?.user?.id;
    const { id } = await params;
    if (!userId || session.user.role !== "EMPLOYER") return new Response("Not found", { status: 404 });
    const job = await db.job.findFirst({ where: { id, employerId: userId }, select: { id: true, title: true } });
    if (!job) return new Response("Not found", { status: 404 });

    const f = parseFilters(Object.fromEntries(new URL(request.url).searchParams));
    const where = rankingWhere(job.id, f);
    const rankOf = await rankOfAll(job.id);
    const encoder = new TextEncoder();
    let skip = 0;

    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(encoder.encode(CSV_BOM + csvRow([...CSV_HEADER])));
        },
        async pull(controller) {
            const rows = await db.interview.findMany({
                where,
                orderBy: RANKING_ORDER[f.sort],
                skip,
                take: BATCH,
                select: {
                    id: true,
                    score: true,
                    decision: true,
                    decisionAt: true,
                    language: true,
                    completedAt: true,
                    candidate: { select: { name: true, email: true } },
                    personalityProfile: { select: { strengths: true, weaknesses: true } },
                },
            });
            skip += rows.length;
            if (!rows.length) return controller.close();

            const spreads = await db.answer.groupBy({
                by: ["interviewId"],
                where: { interviewId: { in: rows.map((r) => r.id) }, score: { not: null } },
                _min: { score: true },
                _max: { score: true },
            });
            const spreadOf = new Map(spreads.map((s) => [s.interviewId, s]));
            const text = rows
                .map((r) =>
                    csvRow([
                        rankOf.get(r.id) ?? "",
                        r.candidate.name ?? "",
                        r.candidate.email,
                        "Finished",
                        DECISION[r.decision] ?? r.decision,
                        istDateTime(r.decisionAt),
                        r.score,
                        spreadOf.get(r.id)?._min.score ?? null,
                        spreadOf.get(r.id)?._max.score ?? null,
                        r.personalityProfile?.strengths[0] ?? "",
                        r.personalityProfile?.weaknesses[0] ?? "",
                        language(r.language),
                        istDateTime(r.completedAt),
                        `${APP_URL}/interview/${r.id}/feedback`,
                    ]),
                )
                .join("");
            controller.enqueue(encoder.encode(text));
            if (rows.length < BATCH) controller.close();
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": attachmentHeader(exportFileName(job.title, new Date())),
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}

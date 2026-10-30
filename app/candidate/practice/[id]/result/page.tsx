import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, RotateCw } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ScoreGauge } from "@/components/soft-glass/score-gauge";
import { CoachBubble } from "@/components/soft-glass/coach-bubble";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";
import { generateDayToken } from "@/lib/day-token";
import { AnswerList } from "./answer-list";

export default async function PracticeResultPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    const mockInterview = await db.mockInterview.findUnique({
        where: {
            id,
            userId: session.user.id,
        },
        include: {
            answers: { orderBy: { createdAt: "asc" } },
            enrollment: { select: { id: true, program: { select: { slug: true } } } },
        },
    });

    if (!mockInterview || !mockInterview.score) {
        redirect("/candidate/practice");
    }

    const { answers } = mockInterview;
    // Unscored answers (0: AI was unavailable) can't be strongest or weakest.
    const scored = answers.filter((a) => (a.score ?? 0) > 0);
    const strongest = scored.reduce<(typeof scored)[number] | null>((best, a) => (!best || a.score! > best.score! ? a : best), null);
    const weakest = scored.reduce<(typeof scored)[number] | null>((low, a) => (!low || a.score! < low.score! ? a : low), null);
    const showExtremes = strongest && weakest && strongest.id !== weakest.id;

    const date = mockInterview.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const again = new URLSearchParams({ role: mockInterview.role, level: mockInterview.difficulty }).toString();
    // A plan checkpoint leads back to its day (AIIN-101)
    const checkpoint =
        mockInterview.enrollment && mockInterview.checkpointDay
            ? {
                  day: mockInterview.checkpointDay,
                  href: `/candidate/placement-program/${mockInterview.enrollment.program.slug}?d=${generateDayToken(mockInterview.enrollment.id, mockInterview.checkpointDay)}`,
              }
            : null;

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <Link
                        href={checkpoint?.href ?? "/candidate/practice"}
                        className={cn(
                            "inline-flex items-center gap-1.5 self-start rounded-full font-semibold text-sg-muted hover:text-sg-text",
                            focusRing
                        )}
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        {checkpoint ? `Day ${checkpoint.day}` : "All practice"}
                    </Link>
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                        {checkpoint ? `Day ${checkpoint.day} checkpoint complete` : "Practice complete"}
                    </h1>
                    <span className="font-medium text-sg-muted">
                        {mockInterview.role} · {mockInterview.difficulty} · {answers.length}{" "}
                        {answers.length === 1 ? "question" : "questions"} · {date}
                    </span>
                </div>
                {checkpoint ? (
                    <Link href={checkpoint.href} className={cn(coralButton, "h-12 px-6")}>
                        Back to day {checkpoint.day}
                    </Link>
                ) : (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Link
                            href="/candidate/practice"
                            className={cn("sg-glass inline-flex h-12 items-center justify-center rounded-full px-[22px] font-bold", focusRing)}
                        >
                            Try a different role
                        </Link>
                        <Link href={`/candidate/practice?${again}`} className={cn(coralButton, "h-12 px-6")}>
                            <RotateCw className="size-4" aria-hidden="true" />
                            Practise again
                        </Link>
                    </div>
                )}
            </div>

            <section
                aria-label="Overall result"
                className="sg-glass sg-shadow-lg grid items-center gap-7 rounded-[24px] p-5 sm:rounded-[28px] sm:p-8 md:grid-cols-2"
            >
                <div className="flex flex-col items-center gap-2 text-center">
                    <ScoreGauge value={mockInterview.score} className="w-56" />
                    <span className="font-semibold">
                        out of 10, across {answers.length} {answers.length === 1 ? "answer" : "answers"}
                    </span>
                </div>
                <div className="flex min-w-0 flex-col gap-4">
                    {mockInterview.feedback && (
                        <CoachBubble>
                            <p className="whitespace-pre-line text-[17px] leading-[27px]">{mockInterview.feedback}</p>
                        </CoachBubble>
                    )}
                    {showExtremes && (
                        <div className="grid gap-2.5 sm:grid-cols-2">
                            <div className="flex min-w-0 flex-col gap-1 rounded-[18px] bg-sg-row px-4 py-3.5">
                                <span className="text-[13px] font-bold leading-[18px] text-sg-muted">
                                    Strongest · {strongest.score!.toFixed(1)}
                                </span>
                                <span className="line-clamp-2 font-semibold">{strongest.question}</span>
                            </div>
                            <div className="flex min-w-0 flex-col gap-1 rounded-[18px] bg-sg-row px-4 py-3.5">
                                <span className="text-[13px] font-bold leading-[18px] text-sg-muted">
                                    Most room to grow · {weakest.score!.toFixed(1)}
                                </span>
                                <span className="line-clamp-2 font-semibold">{weakest.question}</span>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <section aria-labelledby="answers-heading" className="flex flex-col gap-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="answers-heading" className="font-display sg-soft text-[26px] font-semibold leading-[33px] tracking-[-0.015em]">
                        Question by question
                    </h2>
                    <span className="font-medium text-sg-muted">Open a question for feedback</span>
                </div>
                <AnswerList
                    answers={answers.map((a) => ({
                        id: a.id,
                        question: a.question,
                        transcript: a.transcript,
                        score: a.score,
                        feedback: a.feedback,
                    }))}
                />
            </section>
        </div>
    );
}

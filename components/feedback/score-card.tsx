import { useTranslations } from "next-intl";
import { Hourglass } from "lucide-react";
import { ScoreGauge } from "@/components/soft-glass/score-gauge";
import { CoachBubble } from "@/components/soft-glass/coach-bubble";
import { label, row } from "@/components/jobs/employer-ui";

export interface HighlightAnswer {
    question: string;
    score: number;
}

interface ScoreCardProps {
    /** Average score out of 10; null while answers are still being scored. */
    score: number | null;
    answerCount: number;
    viewer: "candidate" | "employer";
    strongest: HighlightAnswer | null;
    weakest: HighlightAnswer | null;
}

/** The overall result: the gauge, U's summary, and the strongest and weakest answers. */
export function ScoreCard({ score, answerCount, viewer, strongest, weakest }: ScoreCardProps) {
    const t = useTranslations("FeedbackReport");
    const band = score === null ? null : score >= 7 ? "high" : score >= 4 ? "mid" : "low";

    return (
        <section
            aria-label={t("overallLabel")}
            className="sg-glass sg-shadow-lg grid grid-cols-1 items-center gap-7 rounded-[24px] p-5 sm:rounded-[28px] sm:p-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
        >
            <div className="flex flex-col items-center gap-2 text-center">
                {score === null ? (
                    <>
                        <span className="inline-flex size-24 items-center justify-center rounded-full bg-sg-chip">
                            <Hourglass className="size-9 text-sg-muted" aria-hidden="true" />
                        </span>
                        <p role="status" className="font-semibold">
                            {t("scoring")}
                        </p>
                    </>
                ) : (
                    <>
                        <ScoreGauge value={score} className="w-56" />
                        <span className="font-semibold">{t("outOf", { count: answerCount })}</span>
                    </>
                )}
            </div>

            <div className="flex min-w-0 flex-col gap-4">
                {band && (
                    <CoachBubble>
                        <p className="text-[17px] leading-[27px]">{t(`summary.${viewer}.${band}`)}</p>
                    </CoachBubble>
                )}
                {(strongest || weakest) && (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {strongest && (
                            <div className={`${row} flex min-w-0 flex-col gap-1`}>
                                <span className={label}>{t("strongest", { score: strongest.score.toFixed(1) })}</span>
                                <span className="line-clamp-2 font-semibold break-words">{strongest.question}</span>
                            </div>
                        )}
                        {weakest && (
                            <div className={`${row} flex min-w-0 flex-col gap-1`}>
                                <span className={label}>{t("weakest", { score: weakest.score.toFixed(1) })}</span>
                                <span className="line-clamp-2 font-semibold break-words">{weakest.question}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

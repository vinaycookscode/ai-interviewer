"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, ChevronDown, Code2, Lightbulb } from "lucide-react";
import { CoachBubble } from "@/components/soft-glass/coach-bubble";
import { focusRing } from "@/components/soft-glass/classes";
import { field, panel, panelTitle, sectionTitle } from "@/components/jobs/employer-ui";
import { CompanyProblemSolver, type SolverQuestion } from "@/components/company-prep/company-problem-solver";
import { companyInitial } from "@/lib/company-prep-format";
import { cn } from "@/lib/utils";

export interface CompanyRound {
    name: string;
    type: string;
    duration: number | null;
    tips: string | null;
}

export interface CompanyGuide {
    overview: string;
    culture: string[];
    interviewTips: string[];
    preparationStrategy: string;
}

interface CompanyDetailClientProps {
    company: {
        name: string;
        slug: string;
        difficulty: string;
        salary: string | null;
        rounds: CompanyRound[];
        guide: CompanyGuide | null;
    };
    questions: SolverQuestion[];
    solvedIds: string[];
    featureFlags: { languageSelector: boolean; codePersistence: boolean; aiCodeAnalysis: boolean; serverJudge: boolean };
}

const TYPES = ["CODING", "APTITUDE", "HR", "GD"] as const;
const LEVELS = ["EASY", "MEDIUM", "HARD"] as const;
// Questions asked this often (out of 10) are marked "Asked often".
const OFTEN = 8;

const chip = "inline-flex h-7 items-center gap-1 rounded-full bg-sg-chip px-2.5 text-sm font-semibold";
const smallChip = "inline-flex h-6 items-center gap-1 rounded-full bg-sg-chip px-2 text-[13px] font-semibold";

export function CompanyDetailClient({ company, questions, solvedIds, featureFlags }: CompanyDetailClientProps) {
    const t = useTranslations("CompanyPrep");
    const [kind, setKind] = useState<string>("ALL");
    const [level, setLevel] = useState<string>("ALL");
    const [openId, setOpenId] = useState<string | null>(questions[0]?.id ?? null);
    const [shownAnswers, setShownAnswers] = useState<Set<string>>(new Set());
    const [solving, setSolving] = useState<SolverQuestion | null>(null);
    const solved = useMemo(() => new Set(solvedIds), [solvedIds]);

    const typeName = (type: string) => ((TYPES as readonly string[]).includes(type) ? t(`types.${type as (typeof TYPES)[number]}`) : type);
    const levelName = (l: string) => ((LEVELS as readonly string[]).includes(l) ? t(`levels.${l as (typeof LEVELS)[number]}`) : l);

    const presentTypes = TYPES.filter((type) => questions.some((q) => q.type === type));
    const shown = questions.filter((q) => (kind === "ALL" || q.type === kind) && (level === "ALL" || q.difficulty === level));
    const doneCount = questions.filter((q) => solved.has(q.id)).length;

    const toggleAnswer = (id: string) =>
        setShownAnswers((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    if (solving) {
        return (
            <CompanyProblemSolver
                question={solving}
                companyName={company.name}
                onClose={() => setSolving(null)}
                featureFlags={featureFlags}
            />
        );
    }

    return (
        <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-4">
                <Link href="/candidate/company-prep" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t("detail.back")}
                </Link>
                <div className="flex flex-wrap items-center gap-4">
                    <span aria-hidden="true" className="font-display sg-soft flex size-16 shrink-0 items-center justify-center rounded-[18px] bg-sg-chip text-[30px] font-semibold">
                        {companyInitial(company.name)}
                    </span>
                    <div className="flex min-w-0 flex-col gap-2">
                        <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] sm:text-[44px]">{company.name}</h1>
                        <span className="flex flex-wrap gap-1.5">
                            <span className={chip}>{levelName(company.difficulty)}</span>
                            <span className={chip}>{t("list.rounds", { count: company.rounds.length })}</span>
                            <span className={chip}>{t("list.questions", { count: questions.length })}</span>
                            {company.salary && <span className={chip}>{t("list.salary", { range: company.salary })}</span>}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-start gap-6">
                <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
                    {company.rounds.length > 0 && (
                        <section aria-label={t("detail.roundsLabel")} className={panel}>
                            <h2 className={panelTitle}>{t("detail.roundsTitle")}</h2>
                            <ol className="flex flex-col">
                                {company.rounds.map((round, i) => {
                                    const last = i === company.rounds.length - 1;
                                    return (
                                        <li key={i} className="flex gap-3.5">
                                            <span className="flex flex-col items-center">
                                                <span
                                                    aria-hidden="true"
                                                    className={cn(
                                                        "flex size-7 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold",
                                                        i === 0 ? "bg-sg-ink text-sg-ink-foreground" : "bg-sg-chip"
                                                    )}
                                                >
                                                    {i + 1}
                                                </span>
                                                {!last && <span aria-hidden="true" className="my-1 w-0.5 flex-1 rounded-full bg-sg-track" />}
                                            </span>
                                            <span className={cn("flex min-w-0 flex-col gap-1", !last && "pb-5")}>
                                                <span className="flex flex-wrap items-baseline gap-x-2">
                                                    <span className="font-bold">{round.name}</span>
                                                    {round.duration ? (
                                                        <span className="text-[13px] leading-[18px] font-medium text-sg-muted">
                                                            {t("detail.roundMeta", { type: round.type, minutes: round.duration })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{round.type}</span>
                                                    )}
                                                </span>
                                                {round.tips && <span className="text-sg-muted">{round.tips}</span>}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        </section>
                    )}

                    <section aria-label={t("detail.questionsLabel")} className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 className={sectionTitle}>{t("detail.questionsTitle")}</h2>
                            {questions.length > 0 && <span className="font-semibold text-sg-muted">{t("detail.progress", { done: doneCount, total: questions.length })}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div role="group" aria-label={t("detail.type")} className="flex flex-wrap gap-2">
                                {(["ALL", ...presentTypes] as string[]).map((type) => {
                                    const on = kind === type;
                                    const count = type === "ALL" ? questions.length : questions.filter((q) => q.type === type).length;
                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            aria-pressed={on}
                                            onClick={() => setKind(type)}
                                            className={cn(
                                                "h-10 rounded-full border-2 px-4 text-sm font-semibold",
                                                on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row hover:bg-sg-chip",
                                                focusRing
                                            )}
                                        >
                                            {t("list.filter", { label: type === "ALL" ? t("types.ALL") : typeName(type), count })}
                                        </button>
                                    );
                                })}
                            </div>
                            <label htmlFor="q-level" className="sr-only">
                                {t("detail.difficulty")}
                            </label>
                            <select id="q-level" value={level} onChange={(e) => setLevel(e.target.value)} className={cn(field, "h-10 w-auto rounded-full px-4 text-sm font-semibold")}>
                                <option value="ALL">{t("detail.anyDifficulty")}</option>
                                {LEVELS.map((l) => (
                                    <option key={l} value={l}>
                                        {levelName(l)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {shown.length === 0 ? (
                            <p className="sg-glass rounded-[22px] p-6 text-sg-muted">{t("detail.noQuestions")}</p>
                        ) : (
                            shown.map((q) => {
                                const open = openId === q.id;
                                const answerShown = shownAnswers.has(q.id);
                                return (
                                    <article key={q.id} className="sg-glass flex flex-col rounded-[22px]">
                                        <button
                                            type="button"
                                            aria-expanded={open}
                                            aria-controls={`q-${q.id}`}
                                            onClick={() => setOpenId(open ? null : q.id)}
                                            className={cn("flex w-full items-start gap-3 rounded-[22px] p-4 text-left sm:p-5", focusRing)}
                                        >
                                            <span className="flex min-w-0 flex-1 flex-col gap-2">
                                                <span className="font-bold">{q.question}</span>
                                                <span className="flex flex-wrap gap-1.5">
                                                    <span className={smallChip}>{typeName(q.type)}</span>
                                                    <span className={smallChip}>{levelName(q.difficulty)}</span>
                                                    {q.frequency >= OFTEN && (
                                                        <span className={cn(smallChip, "bg-sg-lavender-soft text-sg-lavender-ink")}>{t("detail.often")}</span>
                                                    )}
                                                    {solved.has(q.id) && (
                                                        <span className={smallChip}>
                                                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                                            {t("detail.done")}
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            <ChevronDown aria-hidden="true" className={cn("mt-0.5 size-5 shrink-0 transition-transform", open && "rotate-180")} />
                                        </button>
                                        {open && (
                                            <div id={`q-${q.id}`} className="flex flex-col gap-3.5 px-4 pb-4 sm:px-5 sm:pb-5">
                                                {q.tips && (
                                                    <p className="flex items-start gap-2.5">
                                                        <Lightbulb aria-hidden="true" className="mt-[3px] size-4 shrink-0 text-sg-lavender-ink" />
                                                        <span>{q.tips}</span>
                                                    </p>
                                                )}
                                                {answerShown && q.answer && (
                                                    <div className="flex flex-col gap-1 rounded-[18px] bg-sg-row px-4 py-3.5">
                                                        <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("detail.goodAnswer")}</span>
                                                        <span className="whitespace-pre-line">{q.answer}</span>
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-2">
                                                    {q.type === "CODING" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSolving(q)}
                                                            className={cn("inline-flex h-11 items-center gap-2 rounded-full bg-sg-ink px-5 text-[15px] font-bold text-sg-ink-foreground hover:opacity-90", focusRing)}
                                                        >
                                                            <Code2 className="size-4" aria-hidden="true" />
                                                            {t("detail.solve")}
                                                        </button>
                                                    )}
                                                    {q.answer && (
                                                        <button
                                                            type="button"
                                                            aria-expanded={answerShown}
                                                            onClick={() => toggleAnswer(q.id)}
                                                            className={cn("inline-flex h-11 items-center rounded-full border border-sg-field-border px-4 text-sm font-semibold hover:bg-sg-chip", focusRing)}
                                                        >
                                                            {answerShown ? t("detail.hideAnswer") : t("detail.showAnswer")}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            })
                        )}
                    </section>
                </div>

                {company.guide && (
                    <aside aria-label={t("detail.hiresLabel", { company: company.name })} className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[380px]">
                        <div className={panel}>
                            <h2 className={panelTitle}>{t("detail.hiresTitle", { company: company.name })}</h2>
                            {company.guide.overview && <p className="text-sg-muted">{company.guide.overview}</p>}
                            {company.guide.culture.length > 0 && (
                                <>
                                    <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("detail.lookFor")}</span>
                                    <ul className="flex flex-col gap-2.5">
                                        {company.guide.culture.map((item) => (
                                            <li key={item} className="flex items-start gap-2.5">
                                                <CheckCircle2 aria-hidden="true" className="mt-[3px] size-4 shrink-0 text-sg-lavender-ink" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            {company.guide.interviewTips.length > 0 && (
                                <>
                                    <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("detail.tips")}</span>
                                    <ul className="flex flex-col gap-2.5">
                                        {company.guide.interviewTips.map((tip) => (
                                            <li key={tip} className="flex items-start gap-2.5">
                                                <Lightbulb aria-hidden="true" className="mt-[3px] size-4 shrink-0 text-sg-lavender-ink" />
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                        {company.guide.preparationStrategy && (
                            <CoachBubble>
                                <span>{company.guide.preparationStrategy}</span>
                            </CoachBubble>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, Check, CheckCircle2, Copy, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateCoverLetter, rewriteResume } from "@/actions/resume-screener";
import { ResumeDownloader } from "@/components/candidate/resume-downloader";
import { CoachBubble } from "@/components/soft-glass/coach-bubble";
import { focusRing } from "@/components/soft-glass/classes";
import { field, inkButton, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";
import type { ResumeAnalysis as ReviewResult } from "@/types";

/** The service's review, plus what the screener sent: the resume text and, if given, the job description. */
export type ResumeAnalysis = ReviewResult & {
    resumeText?: string;
    /** Set only when a job description was given, so the match score, keywords and cover letter apply. */
    jobDescription?: string;
};

type Tab = "review" | "coverLetter" | "rewrite";
const TABS: Tab[] = ["review", "coverLetter", "rewrite"];

const listPanel = cn(panel, "gap-4");

/** Half-ring score out of 100. */
function ScoreRing({ score, label }: { score: number; label: string }) {
    const arc = Math.PI * 80;
    const value = Math.max(0, Math.min(100, Math.round(score)));
    return (
        <svg role="img" aria-label={label} viewBox="0 0 200 112" className="w-[220px] max-w-full">
            <path d="M20 100a80 80 0 0 1 160 0" fill="none" strokeWidth="16" strokeLinecap="round" className="stroke-sg-track" />
            <path
                d="M20 100a80 80 0 0 1 160 0"
                fill="none"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(value / 100) * arc} ${arc}`}
                className="stroke-sg-lavender"
            />
            <text x="100" y="96" textAnchor="middle" className="fill-sg-text font-display text-[48px] font-semibold">
                {value}
            </text>
        </svg>
    );
}

/** The AI writes points with Markdown emphasis; show it inline, not as stray asterisks. */
function Inline({ text }: { text: string }) {
    return <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>{text}</ReactMarkdown>;
}

function Points({ items, tone }: { items: string[]; tone: "good" | "fix" }) {
    const Icon = tone === "good" ? CheckCircle2 : AlertTriangle;
    return (
        <ul className="flex flex-col gap-2.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                    <Icon aria-hidden="true" className={cn("mt-[3px] size-4 shrink-0", tone === "good" ? "text-sg-lavender-ink" : "text-sg-text")} />
                    <span>
                        <Inline text={item} />
                    </span>
                </li>
            ))}
        </ul>
    );
}

export function ResumeAnalysisView({ analysis }: { analysis: ResumeAnalysis }) {
    const t = useTranslations("ResumeScreener");
    const [tab, setTab] = useState<Tab>("review");
    const hasJd = Boolean(analysis.jobDescription);
    const score = analysis.score;
    const scoreLabel = hasJd ? t("score.match") : t("score.resume");

    const [letter, setLetter] = useState<string | null>(null);
    const [isWriting, setIsWriting] = useState(false);
    const [copied, setCopied] = useState(false);

    const [notes, setNotes] = useState("");
    const [rewrite, setRewrite] = useState<{ content: string; score: number } | null>(null);
    const [isRewriting, setIsRewriting] = useState(false);

    const writeLetter = async () => {
        if (!analysis.resumeText || !analysis.jobDescription) return;
        setIsWriting(true);
        try {
            const result = await generateCoverLetter(analysis.resumeText, analysis.jobDescription);
            if (result.error) toast.error(result.error);
            else if (result.coverLetter) {
                setLetter(result.coverLetter);
                setCopied(false);
            }
        } catch {
            toast.error(t("toast.failed"));
        } finally {
            setIsWriting(false);
        }
    };

    const copyLetter = async () => {
        if (!letter) return;
        await navigator.clipboard.writeText(letter);
        setCopied(true);
        toast.success(t("toast.copied"));
    };

    const runRewrite = async () => {
        if (!analysis.resumeText) {
            toast.error(t("toast.uploadFirst"));
            return;
        }
        setIsRewriting(true);
        try {
            const result = await rewriteResume(analysis.resumeText, analysis, notes);
            if (result.error) toast.error(result.error);
            else setRewrite({ content: result.rewrittenContent, score: result.predictedATSScore });
        } catch {
            toast.error(t("toast.failed"));
        } finally {
            setIsRewriting(false);
        }
    };

    return (
        <>
            <section aria-label={t("score.sectionLabel")} className="sg-glass sg-shadow-lg grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] items-center gap-6 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7">
                <div className="flex flex-col items-center gap-1.5 text-center">
                    <ScoreRing score={score} label={t("score.gaugeLabel", { label: scoreLabel, score: Math.round(score) })} />
                    <span className="font-semibold">{scoreLabel}</span>
                </div>
                <div className="flex flex-col gap-3.5">
                    <CoachBubble>
                        <span className="text-[17px] leading-[27px]">{analysis.summary}</span>
                    </CoachBubble>
                    <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col rounded-[18px] bg-sg-row px-4 py-3.5">
                            <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("score.works")}</span>
                            <span className="font-bold">{t("score.strengths", { count: analysis.strengths.length })}</span>
                        </div>
                        <div className="flex flex-col rounded-[18px] bg-sg-row px-4 py-3.5">
                            <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("score.toFix")}</span>
                            <span className="font-bold">{t("score.gaps", { count: analysis.weaknesses.length })}</span>
                        </div>
                    </div>
                </div>
            </section>

            <div role="tablist" aria-label={t("tabs.label")} className="flex max-w-full gap-1 self-start overflow-x-auto rounded-full bg-sg-chip p-1">
                {TABS.map((id) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        id={`resume-tab-${id}`}
                        aria-selected={tab === id}
                        aria-controls={`resume-panel-${id}`}
                        onClick={() => setTab(id)}
                        className={cn(
                            "min-h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold whitespace-nowrap",
                            tab === id ? "bg-sg-glass-strong text-sg-text shadow-[var(--sg-shadow)]" : "text-sg-muted hover:text-sg-text",
                            focusRing
                        )}
                    >
                        {t(`tabs.${id}`)}
                    </button>
                ))}
            </div>

            {tab === "review" && (
                <div role="tabpanel" id="resume-panel-review" aria-labelledby="resume-tab-review" className="flex flex-col gap-4">
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
                        {analysis.strengths.length > 0 && (
                            <div className={listPanel}>
                                <h3 className={panelTitle}>{t("review.works")}</h3>
                                <Points items={analysis.strengths} tone="good" />
                            </div>
                        )}
                        {analysis.weaknesses.length > 0 && (
                            <div className={listPanel}>
                                <h3 className={panelTitle}>{t("review.fix")}</h3>
                                <Points items={analysis.weaknesses} tone="fix" />
                            </div>
                        )}
                        {hasJd && analysis.keywords.length > 0 && (
                            <div className={listPanel}>
                                <h3 className={panelTitle}>{t("review.missing")}</h3>
                                <p className="text-sg-muted">{t("review.missingBody")}</p>
                                <ul className="flex flex-wrap gap-2">
                                    {analysis.keywords.map((keyword) => (
                                        <li key={keyword} className="rounded-full bg-sg-chip px-3 py-1.5 text-sm font-semibold">
                                            {keyword}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {analysis.formattingIssues && (
                            <div className={listPanel}>
                                <h3 className={panelTitle}>{t("review.formatting")}</h3>
                                {analysis.formattingIssues.length > 0 ? (
                                    <Points items={analysis.formattingIssues} tone="fix" />
                                ) : (
                                    <p className="flex items-center gap-2">
                                        <CheckCircle2 aria-hidden="true" className="size-4 text-sg-lavender-ink" />
                                        {t("review.formattingClean")}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    {analysis.suggestions.length > 0 && (
                        <div className={listPanel}>
                            <h3 className={panelTitle}>{t("review.first")}</h3>
                            <ol className="flex flex-col gap-2.5">
                                {analysis.suggestions.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-sg-chip text-[13px] font-bold">
                                            {i + 1}
                                        </span>
                                        <span className="pt-[3px]">
                                            <Inline text={tip} />
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>
            )}

            {tab === "coverLetter" && (
                <div role="tabpanel" id="resume-panel-coverLetter" aria-labelledby="resume-tab-coverLetter" className={listPanel}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className={panelTitle}>{t("letter.title")}</h3>
                        {letter && (
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={writeLetter} disabled={isWriting} className={cn(outlineButton, "h-10 text-sm")}>
                                    {isWriting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
                                    {isWriting ? t("letter.writing") : t("letter.again")}
                                </button>
                                <button type="button" onClick={copyLetter} className={cn(inkButton, "h-10 px-4 text-sm")}>
                                    {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                                    {copied ? t("letter.copied") : t("letter.copy")}
                                </button>
                            </div>
                        )}
                    </div>
                    {!hasJd ? (
                        <p className="text-sg-muted">{t("letter.needsJd")}</p>
                    ) : letter ? (
                        <>
                            <div className="flex flex-col gap-3 rounded-[18px] bg-sg-row p-5 [&_p]:m-0">
                                <ReactMarkdown>{letter}</ReactMarkdown>
                            </div>
                            <p className="text-sm text-sg-muted">{t("letter.note")}</p>
                        </>
                    ) : (
                        <>
                            <p className="text-sg-muted">{t("letter.readyBody")}</p>
                            <button type="button" onClick={writeLetter} disabled={isWriting} className={cn(inkButton, "h-12 self-start")}>
                                {isWriting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                                {isWriting ? t("letter.writing") : t("letter.write")}
                            </button>
                        </>
                    )}
                </div>
            )}

            {tab === "rewrite" && (
                <div role="tabpanel" id="resume-panel-rewrite" aria-labelledby="resume-tab-rewrite" className={listPanel}>
                    <h3 className={panelTitle}>{t("rewrite.title")}</h3>
                    <p className="text-sg-muted">{t("rewrite.body")}</p>
                    <label htmlFor="rw-notes" className="text-sm leading-5 font-semibold">
                        {t("rewrite.notesLabel")} <span className="font-medium text-sg-muted">{t("rewrite.notesHint")}</span>
                    </label>
                    <textarea
                        id="rw-notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isRewriting}
                        placeholder={t("rewrite.notesPlaceholder")}
                        className={cn(field, "resize-y py-3")}
                    />
                    <button type="button" onClick={runRewrite} disabled={isRewriting} className={cn(inkButton, "h-12 self-start")}>
                        {isRewriting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                        {isRewriting ? t("rewrite.rewriting") : t("rewrite.submit")}
                    </button>
                    {rewrite && (
                        <>
                            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-sg-row px-4 py-3.5">
                                <span className="flex flex-col">
                                    <span className="font-bold">{t("rewrite.done")}</span>
                                    <span className="text-sg-muted">{t("rewrite.expected", { score: rewrite.score, from: Math.round(analysis.score) })}</span>
                                </span>
                                <ResumeDownloader content={rewrite.content} label={t("rewrite.download")} />
                            </div>
                            <div
                                role="region"
                                aria-label={t("rewrite.preview")}
                                className="prose prose-sm max-h-[600px] max-w-none overflow-y-auto rounded-[18px] bg-sg-row p-5 text-sg-text dark:prose-invert"
                            >
                                <ReactMarkdown>{rewrite.content}</ReactMarkdown>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}

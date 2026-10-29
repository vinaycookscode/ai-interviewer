"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { analyzeResume } from "@/actions/resume-screener";
import { ResumeAnalysisView, type ResumeAnalysis } from "@/components/candidate/resume-analysis-view";
import { Mascot } from "@/components/soft-glass/mascot";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, glassButton, inkButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface ResumeScreenerViewProps {
    resumeUrl: string | null;
    resumeName: string | null;
}

export function ResumeScreenerView({ resumeUrl, resumeName }: ResumeScreenerViewProps) {
    const t = useTranslations("ResumeScreener");
    const [jobDescription, setJobDescription] = useState("");
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleAnalyze = () => {
        if (!resumeUrl) {
            toast.error(t("toast.uploadFirst"));
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append("resumeUrl", resumeUrl);
            if (jobDescription.trim()) formData.append("jobDescription", jobDescription);

            const result = await analyzeResume(formData);
            if (result.error) {
                toast.error(result.error);
            } else if (result.success && result.analysis) {
                setAnalysis(result.analysis);
                toast.success(t("toast.reviewed"));
            }
        });
    };

    // A finished review switches the button to a quieter "Review again"; one coral action per view.
    const ctaClass = analysis && !isPending ? cn(inkButton, "h-12 w-full") : cn(coralButton, "h-12 w-full");

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[680px] flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                    {t("title")}
                </h1>
                <p className="text-lg text-sg-muted">{t("description")}</p>
            </div>

            <div className="flex flex-wrap items-start gap-6">
                <section aria-label={t("resume.title")} className={cn(panel, "max-w-full flex-[1_1_320px] gap-[18px]")}>
                    <h2 className={panelTitle}>{t("resume.title")}</h2>

                    {resumeUrl ? (
                        <div className="flex items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3.5">
                            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sg-lavender-soft text-sg-lavender-ink">
                                <FileText className="size-5" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="font-bold [overflow-wrap:anywhere]">{resumeName || t("resume.defaultName")}</span>
                                <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{t("resume.fromProfile")}</span>
                            </span>
                            <Link href="/candidate/profile" aria-label={t("resume.replaceLabel")} className={cn("rounded-lg p-2 font-bold", focusRing)}>
                                {t("resume.replace")}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-start gap-2.5 rounded-[18px] border-2 border-dashed border-sg-field-border p-5">
                            <span className="font-bold">{t("resume.noneTitle")}</span>
                            <span className="text-sg-muted">{t("resume.noneBody")}</span>
                            <Link href="/candidate/profile" className={cn(glassButton, "h-11 text-[15px]")}>
                                <Upload className="size-4" aria-hidden="true" />
                                {t("resume.add")}
                            </Link>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label htmlFor="jd" className="text-sm leading-5 font-semibold">
                            {t("jd.label")} <span className="font-medium text-sg-muted">{t("jd.hint")}</span>
                        </label>
                        <textarea
                            id="jd"
                            rows={6}
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            disabled={isPending}
                            placeholder={t("jd.placeholder")}
                            className={cn(field, "min-h-[150px] resize-y py-3")}
                        />
                    </div>

                    <button type="button" onClick={handleAnalyze} disabled={!resumeUrl || isPending} className={ctaClass}>
                        {isPending ? t("cta.reviewing") : analysis ? t("cta.again") : t("cta.review")}
                    </button>
                </section>

                <section aria-label={t("tabs.review")} className="flex min-w-0 flex-[999_1_520px] flex-col gap-5">
                    {isPending ? (
                        <div role="status" className="sg-glass flex min-h-[420px] flex-col gap-5 rounded-[28px] p-6 sm:p-8">
                            <div className="flex items-center gap-3.5">
                                <Mascot className="size-12" />
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-lg font-bold">{t("analysing.title")}</span>
                                    <span className="text-sg-muted">{jobDescription.trim() ? t("analysing.withJd") : t("analysing.withoutJd")}</span>
                                </div>
                            </div>
                            <div aria-hidden="true" className="flex flex-col gap-3">
                                <div className="sg-skeleton h-[120px] rounded-[22px]" />
                                <div className="sg-skeleton h-[18px] w-[70%] rounded-full" />
                                <div className="sg-skeleton h-[18px] w-[54%] rounded-full" />
                                <div className="sg-skeleton h-[18px] w-[62%] rounded-full" />
                            </div>
                        </div>
                    ) : analysis ? (
                        <ResumeAnalysisView analysis={analysis} />
                    ) : (
                        <div className="sg-glass flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-[28px] p-6 text-center sm:p-8">
                            <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-[14px] bg-sg-chip">
                                <FileText className="size-6" />
                            </span>
                            <h2 className={panelTitle}>{t("ready.title")}</h2>
                            <p className="max-w-[380px] text-sg-muted">{t("ready.body")}</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

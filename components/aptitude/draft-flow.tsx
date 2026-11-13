"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Loader2, Sparkles, Trash2 } from "lucide-react";
import { addDraft, draftQuestions, type Draft } from "@/actions/aptitude-tests";
import { LEVELS, type Level } from "@/lib/aptitude-tests";
import { coralButton } from "@/components/soft-glass/classes";
import { field, fieldLabel, inkButton, outlineButton, panel } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Draft questions with AI, then check each answer before it can be used (AIIN-226 AC3). */
export function DraftFlow({ testId, sections }: { testId: string; sections: { id: string; name: string }[] }) {
    const t = useTranslations("AptitudeTests");
    const [topic, setTopic] = useState("");
    const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
    const [level, setLevel] = useState<Level>("FRESHER");
    const [count, setCount] = useState(5);
    const [drafts, setDrafts] = useState<(Draft & { state: "new" | "added" | "gone"; sectionId: string })[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isPending, start] = useTransition();
    const added = drafts.filter((d) => d.state === "added").length;

    const draft = () =>
        start(async () => {
            setError(null);
            const r = await draftQuestions(testId, { topic, sectionId, level, count }).catch(() => ({ error: "unavailable" as const }));
            if ("ok" in r) setDrafts([...drafts, ...r.drafts.map((d) => ({ ...d, state: "new" as const, sectionId }))]);
            else setError(r.error === "limit" ? t("limit") : r.error === "invalid" ? t("invalid") : r.error === "locked" ? t("lockedError") : t("unavailable"));
        });
    const keep = (i: number) =>
        start(async () => {
            const d = drafts[i];
            const r = await addDraft(testId, d.sectionId, d).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) setDrafts(drafts.map((x, k) => (k === i ? { ...x, state: "added" } : x)));
            else setError(r.error === "locked" ? t("lockedError") : t("invalid"));
        });

    return (
        <div className="flex flex-col gap-6">
            <section className={cn(panel, "gap-3.5")} aria-label={t("draftTitle")}>
                <div className="flex flex-wrap items-start gap-3">
                    <div className="flex min-w-0 flex-[3_1_300px] flex-col gap-1.5">
                        <label htmlFor="ai-topic" className={fieldLabel}>
                            {t("topic")}
                        </label>
                        <input id="ai-topic" value={topic} maxLength={200} placeholder={t("topicPlaceholder")} onChange={(e) => setTopic(e.target.value)} className={cn(field, "h-12")} />
                    </div>
                    <div className="flex min-w-0 flex-[1_1_160px] flex-col gap-1.5">
                        <label htmlFor="ai-sec" className={fieldLabel}>
                            {t("sectionName")}
                        </label>
                        <select id="ai-sec" value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={cn(field, "h-12")}>
                            {sections.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex min-w-0 flex-[1_1_140px] flex-col gap-1.5">
                        <label htmlFor="ai-lvl" className={fieldLabel}>
                            {t("level")}
                        </label>
                        <select id="ai-lvl" value={level} onChange={(e) => setLevel(e.target.value as Level)} className={cn(field, "h-12")}>
                            {LEVELS.map((l) => (
                                <option key={l} value={l}>
                                    {t(`levels.${l}`)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex min-w-0 flex-[1_1_110px] flex-col gap-1.5">
                        <label htmlFor="ai-n" className={fieldLabel}>
                            {t("howMany")}
                        </label>
                        <select id="ai-n" value={count} onChange={(e) => setCount(Number(e.target.value))} className={cn(field, "h-12")}>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" disabled={isPending || !topic.trim()} onClick={draft} className={cn(outlineButton, "h-12 px-5")}>
                        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
                        {t("draft", { count })}
                    </button>
                    <span className="text-[13px] text-sg-muted">{t("draftsDontCount")}</span>
                </div>
                {error && (
                    <p role="alert" className="text-sm font-semibold text-sg-danger">
                        {error}
                    </p>
                )}
            </section>
            <p className="flex items-start gap-2.5 rounded-2xl bg-sg-lavender-soft px-4 py-3 text-sm text-sg-lavender-ink">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("aiWarning")}
            </p>
            {drafts.length === 0 ? (
                <p className="text-sm text-sg-muted">{t("noDrafts")}</p>
            ) : (
                <div className="grid items-start gap-5 lg:grid-cols-2">
                    {drafts.map((d, i) =>
                        d.state === "gone" ? null : (
                            <article key={i} className={cn(panel, "gap-3")}>
                                <span className="text-[13px] font-bold text-sg-muted">{t("draftN", { n: i + 1 })}</span>
                                <strong className="text-[17px] leading-[26px] break-words">{d.question}</strong>
                                <ol className="flex flex-col gap-1">
                                    {d.options.map((o, k) => (
                                        <li key={k} className={cn("flex items-center gap-2 rounded-xl px-3 py-2", k === d.correct && "bg-sg-chip")}>
                                            {k === d.correct ? <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> : <span className="w-4 shrink-0" />}
                                            <span className={cn("break-words", k === d.correct && "font-bold")}>{o}</span>
                                            {k === d.correct && <span className="text-[13px] font-bold">· {t("suggested")}</span>}
                                        </li>
                                    ))}
                                </ol>
                                {d.explanation && <p className="text-sm text-sg-muted">{t("whyLabel", { text: d.explanation })}</p>}
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    {d.state === "added" ? (
                                        <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-bold text-sg-success">
                                            <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                            {t("added")}
                                        </span>
                                    ) : (
                                        <>
                                            <button type="button" onClick={() => setDrafts(drafts.map((x, k) => (k === i ? { ...x, state: "gone" } : x)))} className={cn(outlineButton, "h-10 text-sm")}>
                                                <Trash2 className="size-4" aria-hidden="true" />
                                                {t("discard")}
                                            </button>
                                            <button type="button" disabled={isPending} onClick={() => keep(i)} className={cn(inkButton, "h-10 px-4 text-sm")}>
                                                <Check className="size-4" aria-hidden="true" />
                                                {t("addRight")}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </article>
                        ),
                    )}
                </div>
            )}
            <div className="flex justify-end">
                <Link href={`/dashboard/drives/tests/${testId}`} className={cn(coralButton, "h-12 px-6 text-base")}>
                    {t("backToTest")} {added > 0 && `· ${t("added")} ${added}`}
                    <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
}

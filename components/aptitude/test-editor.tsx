"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, FileText, Loader2, PencilLine, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { importQuestionCsv, previewQuestionCsv, retireQuestion, saveQuestion, saveTestSettings, type CsvPreview } from "@/actions/aptitude-tests";
import { LIMITS } from "@/lib/aptitude-tests";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, fieldLabel, inkButton, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export interface EditorSection {
    id: string;
    name: string;
    askCount: number;
    checked: number;
}
export interface EditorQuestion {
    id: string;
    sectionId: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    checked: boolean;
}
type Result = { ok: true } | { error: string } | { errors: Record<string, string> };

const TEMPLATE =
    "data:text/csv;charset=utf-8," +
    encodeURIComponent("section,question,option 1,option 2,option 3,option 4,correct,explanation\nSection 1,What is 15% of 240?,32,36,40,24,2,0.15 × 240 = 36\n");

/** The test editor (AIIN-226), from the approved "Aptitude test editor" artboards. */
export function TestEditor({ testId, initial, sections, questions }: { testId: string; initial: { name: string; minutes: number; shuffle: boolean }; sections: EditorSection[]; questions: EditorQuestion[] }) {
    const t = useTranslations("AptitudeTests");
    const router = useRouter();
    const [isPending, start] = useTransition();
    const [settings, setSettings] = useState({ name: initial.name, minutes: String(initial.minutes), shuffle: initial.shuffle });
    const [rows, setRows] = useState(sections.map((s) => ({ id: s.id as string | undefined, name: s.name, askCount: String(s.askCount) })));
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dialog, setDialog] = useState<EditorQuestion | "new" | null>(null);
    const [filter, setFilter] = useState<"all" | "check" | string>("all");
    const [csvOpen, setCsvOpen] = useState(false);
    useEffect(() => setRows(sections.map((s) => ({ id: s.id, name: s.name, askCount: String(s.askCount) }))), [sections]);

    const handle = (r: Result, done?: () => void) => {
        if ("ok" in r) {
            done?.();
            router.refresh();
        } else if ("errors" in r) setErrors(r.errors);
        else toast.error(r.error === "locked" ? t("lockedError") : r.error === "inUse" ? t("inUse") : t("failed"));
    };
    const saveSetup = () =>
        start(async () => {
            setErrors({});
            const r = await saveTestSettings(testId, { ...settings, sections: rows }).catch(() => ({ error: "failed" }));
            handle(r, () => toast.success(t("saved")));
        });
    const shown = questions.filter((q) => (filter === "all" ? true : filter === "check" ? !q.checked : q.sectionId === filter));
    const sectionName = (id: string) => sections.find((s) => s.id === id)?.name ?? "";
    const pill = (on: boolean) =>
        cn("inline-flex h-10 items-center rounded-full border-2 px-3.5 text-sm font-semibold", on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text", focusRing);

    return (
        <div className="flex flex-col gap-6">
            <section aria-labelledby="te-setup" className={cn(panel, "gap-4")}>
                <h2 id="te-setup" className={panelTitle}>
                    {t("setup")}
                </h2>
                <div className="flex flex-wrap items-start gap-3">
                    <div className="flex min-w-0 flex-[2_1_260px] flex-col gap-1.5">
                        <label htmlFor="te-name" className={fieldLabel}>
                            {t("name")}
                        </label>
                        <input id="te-name" value={settings.name} maxLength={LIMITS.name} aria-invalid={!!errors.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className={cn(field, "h-12")} />
                    </div>
                    <div className="flex min-w-0 flex-[1_1_140px] flex-col gap-1.5">
                        <label htmlFor="te-min" className={fieldLabel}>
                            {t("minutes")}
                        </label>
                        <input id="te-min" inputMode="numeric" value={settings.minutes} aria-invalid={!!errors.minutes} aria-describedby="te-min-h" onChange={(e) => setSettings({ ...settings, minutes: e.target.value })} className={cn(field, "h-12")} />
                        <span id="te-min-h" className={cn("text-[13px]", errors.minutes ? "font-semibold text-sg-danger" : "text-sg-muted")}>
                            {t("minutesHint")}
                        </span>
                    </div>
                </div>
                <label className="flex items-start justify-between gap-4">
                    <span className="flex flex-col">
                        <span className="font-semibold">{t("shuffle")}</span>
                        <span className="text-[13px] text-sg-muted">{t("shuffleHint")}</span>
                    </span>
                    <input type="checkbox" role="switch" checked={settings.shuffle} onChange={(e) => setSettings({ ...settings, shuffle: e.target.checked })} className="mt-1 size-6 shrink-0 accent-[var(--sg-ink)]" />
                </label>
                <h3 className="font-display sg-soft text-[20px] font-semibold">{t("sections")}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                    {rows.map((r, i) => {
                        const s = sections.find((x) => x.id === r.id);
                        const ok = s ? s.checked >= s.askCount : false;
                        return (
                            <fieldset key={r.id ?? `new-${i}`} className="flex flex-col gap-2.5 rounded-[18px] bg-sg-row p-4">
                                <legend className="sr-only">{r.name || t("sectionName")}</legend>
                                <div className="flex flex-wrap items-end gap-2">
                                    <div className="flex min-w-0 flex-[2_1_170px] flex-col gap-1.5">
                                        <label htmlFor={`te-s${i}`} className={fieldLabel}>
                                            {t("sectionName")}
                                        </label>
                                        <input id={`te-s${i}`} value={r.name} maxLength={LIMITS.section} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className={cn(field, "h-11")} />
                                    </div>
                                    <div className="flex w-24 shrink-0 flex-col gap-1.5">
                                        <label htmlFor={`te-a${i}`} className={fieldLabel}>
                                            {t("ask")}
                                        </label>
                                        <input id={`te-a${i}`} inputMode="numeric" value={r.askCount} onChange={(e) => setRows(rows.map((x, k) => (k === i ? { ...x, askCount: e.target.value } : x)))} className={cn(field, "h-11")} />
                                    </div>
                                    {rows.length > 1 && (
                                        <button type="button" aria-label={t("removeSection", { name: r.name })} onClick={() => setRows(rows.filter((_, k) => k !== i))} className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-sg-chip", focusRing)}>
                                            <X className="size-4" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>
                                {s && (
                                    <span className={cn("inline-flex items-center gap-1.5 self-start rounded-full bg-sg-chip px-3 py-1 text-[13px] font-bold", ok ? "text-sg-success" : "text-sg-text")}>
                                        {ok ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <AlertTriangle className="size-3.5" aria-hidden="true" />}
                                        {t("sectionStatus", { have: s.checked, ask: s.askCount })}
                                    </span>
                                )}
                            </fieldset>
                        );
                    })}
                </div>
                {errors.sections && (
                    <p role="alert" className="text-[13px] font-semibold text-sg-danger">
                        {t("sectionsHint")}
                    </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setRows([...rows, { id: undefined, name: "", askCount: "10" }])} className={cn(outlineButton, "h-10 text-sm")}>
                        <Plus className="size-4" aria-hidden="true" />
                        {t("addSection")}
                    </button>
                    <span className="flex-[1_1_240px] text-[13px] text-sg-muted">{t("sectionsHint")}</span>
                    <button type="button" disabled={isPending} onClick={saveSetup} className={cn(inkButton, "h-11 px-5")}>
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {t("saveSetup")}
                    </button>
                </div>
            </section>

            <section aria-labelledby="te-q" className={cn(panel, "gap-3")}>
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <h2 id="te-q" className={panelTitle}>
                        {t("questions", { count: questions.length })}
                    </h2>
                    <span className="flex flex-wrap gap-2">
                        <button type="button" aria-expanded={csvOpen} onClick={() => setCsvOpen(!csvOpen)} className={cn(outlineButton, "h-10 text-sm")}>
                            <Upload className="size-4" aria-hidden="true" />
                            {t("importCsv")}
                        </button>
                        <Link href={`/dashboard/drives/tests/${testId}/draft`} className={cn(outlineButton, "h-10 text-sm")}>
                            <Sparkles className="size-4" aria-hidden="true" />
                            {t("draftAi")}
                        </Link>
                        <button type="button" onClick={() => setDialog("new")} className={cn(inkButton, "h-10 px-4 text-sm")}>
                            <Plus className="size-4" aria-hidden="true" />
                            {t("add")}
                        </button>
                    </span>
                </div>
                {csvOpen && <CsvImport testId={testId} onDone={() => (setCsvOpen(false), router.refresh())} />}
                <nav aria-label={t("filter")} className="flex flex-wrap gap-2">
                    <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={pill(filter === "all")}>
                        {t("all", { count: questions.length })}
                    </button>
                    {questions.some((q) => !q.checked) && (
                        <button type="button" aria-pressed={filter === "check"} onClick={() => setFilter("check")} className={pill(filter === "check")}>
                            {t("needsCheck", { count: questions.filter((q) => !q.checked).length })}
                        </button>
                    )}
                    {sections.length > 1 &&
                        sections.map((s) => (
                            <button key={s.id} type="button" aria-pressed={filter === s.id} onClick={() => setFilter(s.id)} className={pill(filter === s.id)}>
                                {s.name} · {questions.filter((q) => q.sectionId === s.id).length}
                            </button>
                        ))}
                </nav>
                {shown.length === 0 ? (
                    <p className="text-sm text-sg-muted">{t("noQuestions")}</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {shown.map((q, i) => (
                            <li key={q.id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-[18px] bg-sg-row px-4 py-3">
                                <span className="w-8 text-[13px] text-sg-muted tabular-nums">#{i + 1}</span>
                                <span className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                                    <span className="break-words">{q.text}</span>
                                    <span className="text-[13px] text-sg-muted">{sectionName(q.sectionId)}</span>
                                </span>
                                <span className={cn("inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-bold", q.checked ? "text-sg-success" : "text-sg-text")}>
                                    {q.checked ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <AlertTriangle className="size-3.5" aria-hidden="true" />}
                                    {q.checked ? t("checked") : t("needsCheckChip")}
                                </span>
                                <button type="button" onClick={() => setDialog(q)} className={cn(outlineButton, "h-10 text-sm")}>
                                    <PencilLine className="size-4" aria-hidden="true" />
                                    {t("edit")}
                                </button>
                                <button
                                    type="button"
                                    aria-label={`${t("retire")}: ${q.text.slice(0, 60)}`}
                                    onClick={() => confirm(t("retireConfirm")) && start(async () => handle(await retireQuestion(testId, q.id).catch(() => ({ error: "failed" }))))}
                                    className={cn("inline-flex size-10 items-center justify-center rounded-full hover:bg-sg-chip", focusRing)}
                                >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {dialog && (
                <QuestionDialog
                    testId={testId}
                    sections={sections}
                    question={dialog === "new" ? null : dialog}
                    onClose={() => setDialog(null)}
                    onSaved={(again) => {
                        router.refresh();
                        setDialog(again ? null : null);
                        if (again) setTimeout(() => setDialog("new"), 0);
                    }}
                />
            )}
        </div>
    );
}

function QuestionDialog({
    testId,
    sections,
    question,
    onClose,
    onSaved,
}: {
    testId: string;
    sections: EditorSection[];
    question: EditorQuestion | null;
    onClose: () => void;
    onSaved: (again: boolean) => void;
}) {
    const t = useTranslations("AptitudeTests");
    const [q, setQ] = useState<EditorQuestion>(
        question ?? { id: "", sectionId: sections[0]?.id ?? "", text: "", options: ["", "", "", ""], correctIndex: 0, explanation: "", checked: true },
    );
    const [error, setError] = useState<string | null>(null);
    const [isPending, start] = useTransition();
    const first = useRef<HTMLSelectElement>(null);
    useEffect(() => {
        first.current?.focus();
        const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", esc);
        return () => document.removeEventListener("keydown", esc);
    }, [onClose]);
    const save = (again: boolean) =>
        start(async () => {
            setError(null);
            const r = await saveQuestion(testId, question?.id ?? null, { sectionId: q.sectionId, text: q.text, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, checked: q.checked }).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) onSaved(again);
            else setError(r.error === "invalid" ? t("invalid") : r.error === "locked" ? t("lockedError") : t("failed"));
        });
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--sg-bg)_72%,transparent)] p-3 pt-12 backdrop-blur-[6px] sm:pt-20">
            <div role="dialog" aria-modal="true" aria-labelledby="qd-t" className="sg-glass-strong sg-shadow-lg flex w-full max-w-[640px] flex-col gap-4 rounded-[28px] p-5 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                    <h2 id="qd-t" className={panelTitle}>
                        {question ? t("dialogEdit") : t("dialogAdd")}
                    </h2>
                    <button type="button" aria-label={t("cancel")} onClick={onClose} className={cn("inline-flex size-10 items-center justify-center rounded-full hover:bg-sg-chip", focusRing)}>
                        <X className="size-[18px]" aria-hidden="true" />
                    </button>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="qd-sec" className={fieldLabel}>
                        {t("sectionName")}
                    </label>
                    <select ref={first} id="qd-sec" value={q.sectionId} onChange={(e) => setQ({ ...q, sectionId: e.target.value })} className={cn(field, "h-12")}>
                        {sections.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="qd-text" className={fieldLabel}>
                        {t("question")}
                    </label>
                    <textarea id="qd-text" rows={3} maxLength={LIMITS.text} value={q.text} onChange={(e) => setQ({ ...q, text: e.target.value })} className={cn(field, "resize-y py-3")} />
                </div>
                <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1.5 text-sm font-semibold">{t("options")}</legend>
                    {q.options.map((o, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <label className={cn("inline-flex h-12 w-28 shrink-0 cursor-pointer items-center gap-2 rounded-[14px] px-3 text-sm font-bold", q.correctIndex === i ? "bg-sg-ink text-sg-ink-foreground" : "bg-sg-chip")}>
                                <input type="radio" name="qd-correct" checked={q.correctIndex === i} onChange={() => setQ({ ...q, correctIndex: i })} aria-label={t("correctFor", { n: i + 1 })} className="size-[18px] accent-[var(--sg-coral)]" />
                                {t("correct")}
                            </label>
                            <label htmlFor={`qd-o${i}`} className="sr-only">
                                {t("option", { n: i + 1 })}
                            </label>
                            <input id={`qd-o${i}`} value={o} maxLength={LIMITS.option} onChange={(e) => setQ({ ...q, options: q.options.map((x, k) => (k === i ? e.target.value : x)) })} className={cn(field, "h-12 min-w-0 flex-1")} />
                        </div>
                    ))}
                    {q.options.length < LIMITS.maxOptions && (
                        <button type="button" onClick={() => setQ({ ...q, options: [...q.options, ""] })} className={cn(outlineButton, "h-10 self-start text-sm")}>
                            <Plus className="size-4" aria-hidden="true" />
                            {t("addOption")}
                        </button>
                    )}
                    <span className="text-[13px] text-sg-muted">{t("optionsHint")}</span>
                </fieldset>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="qd-why" className={fieldLabel}>
                        {t("why")}
                    </label>
                    <textarea id="qd-why" rows={2} maxLength={LIMITS.explanation} value={q.explanation} aria-describedby="qd-why-h" onChange={(e) => setQ({ ...q, explanation: e.target.value })} className={cn(field, "resize-y py-3")} />
                    <span id="qd-why-h" className="text-[13px] text-sg-muted">
                        {t("whyHint")}
                    </span>
                </div>
                <label className="flex items-start justify-between gap-4">
                    <span className="flex flex-col">
                        <span className="font-semibold">{t("iChecked")}</span>
                        <span className="text-[13px] text-sg-muted">{t("iCheckedHint")}</span>
                    </span>
                    <input type="checkbox" role="switch" checked={q.checked} onChange={(e) => setQ({ ...q, checked: e.target.checked })} className="mt-1 size-6 shrink-0 accent-[var(--sg-ink)]" />
                </label>
                {error && (
                    <p role="alert" className="text-sm font-semibold text-sg-danger">
                        {error}
                    </p>
                )}
                <div className="flex flex-wrap justify-end gap-2.5">
                    {!question && (
                        <button type="button" disabled={isPending} onClick={() => save(true)} className={cn(outlineButton, "h-12 px-5")}>
                            {t("saveAnother")}
                        </button>
                    )}
                    <button type="button" disabled={isPending} onClick={() => save(false)} className={cn(coralButton, "h-12 px-6")}>
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {t("save")}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CsvImport({ testId, onDone }: { testId: string; onDone: () => void }) {
    const t = useTranslations("AptitudeTests");
    const input = useRef<HTMLInputElement>(null);
    const [text, setText] = useState<string | null>(null);
    const [preview, setPreview] = useState<CsvPreview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, start] = useTransition();
    const choose = async (f: File | undefined) => {
        if (!f) return;
        setError(null);
        if (!/\.csv$/i.test(f.name) || f.size > 2 * 1024 * 1024) return setError(t("tooBig"));
        const s = await f.text();
        setText(s);
        start(async () => {
            const r = await previewQuestionCsv(testId, s).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) setPreview(r);
            else setError(r.error === "tooBig" ? t("tooBig") : r.error === "locked" ? t("lockedError") : t("failed"));
        });
    };
    return (
        <div className="flex flex-col gap-3 rounded-[18px] bg-sg-row p-4">
            <strong>{t("csvTitle")}</strong>
            <span className="text-[13px] text-sg-muted">{t("csvHint")}</span>
            <input ref={input} id="te-csv" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
            <span className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => input.current?.click()} className={cn(outlineButton, "h-10 text-sm")}>
                    {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
                    {t("csvChoose")}
                </button>
                <a href={TEMPLATE} download="aptitude-questions-template.csv" className={cn("inline-flex items-center gap-1.5 rounded-md text-sm font-bold", focusRing)}>
                    {t("csvTemplate")}
                    <Download className="size-3.5" aria-hidden="true" />
                </a>
            </span>
            {error && (
                <p role="alert" className="text-sm font-semibold text-sg-danger">
                    {error}
                </p>
            )}
            {preview && (
                <>
                    <strong>{t("csvReady", { ready: preview.ready, problems: preview.rows.length })}</strong>
                    {preview.rows.length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                            {preview.rows.map((r) => (
                                <li key={r.line} className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    <span className="break-words">
                                        <strong>{t("row", { n: r.line })}:</strong> {t(`csvStatus.${r.status}`)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {preview.ready > 0 && text && (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                                start(async () => {
                                    const r = await importQuestionCsv(testId, text).catch(() => ({ error: "failed" as const }));
                                    if ("ok" in r) {
                                        toast.success(t("csvImported", { count: r.imported }));
                                        onDone();
                                    } else setError(t("failed"));
                                })
                            }
                            className={cn(inkButton, "h-10 self-start px-4 text-sm")}
                        >
                            <Upload className="size-4" aria-hidden="true" />
                            {t("csvImport", { count: preview.ready })}
                        </button>
                    )}
                </>
            )}
        </div>
    );
}

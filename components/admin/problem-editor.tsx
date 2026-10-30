"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import { AlertCircle, Archive, ArrowDown, ArrowLeft, ArrowUp, Check, Eye, EyeOff, Loader2, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { archiveProblem, checkProblem, publishProblem, restoreProblem, saveProblem, type FailedTest } from "@/actions/admin-problems";
import { DIFFICULTIES, LIMITS, PROBLEM_TYPES, SOLUTION_LANGUAGES, type ProblemDraft, type ProblemTest } from "@/lib/problems/rules";
import { StatusChip } from "@/components/admin/problem-status";
import { coralButton, fieldInput, focusRing } from "@/components/soft-glass/classes";
import { iconButton, inkButton, label, outlineButton, panel, panelTitle, row } from "@/components/jobs/employer-ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProblemEditorProps {
    id: string;
    initial: ProblemDraft;
    status: string;
    /** The saved solution passes every saved test. */
    checked: boolean;
    kits: { id: string; company: string }[];
    history: { id: string; who: string; what: string; when: string }[];
}

type Check = { passed: boolean; ms: number; results: { n: number; passed: boolean }[]; failed: FailedTest | null } | null;

const fieldLabel = "text-sm font-semibold";
const area = cn("w-full rounded-2xl border border-sg-field-border bg-sg-row px-4 py-3 text-sg-text placeholder:text-sg-muted/60", focusRing);
const mono = "font-mono text-sm leading-[22px]";
const selectField = cn("h-12 w-full rounded-2xl border border-sg-field-border bg-sg-row px-3.5 text-[15px] text-sg-text", focusRing);
const pill = "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold whitespace-nowrap";
const markdown = "flex flex-col gap-3 [&_code]:rounded [&_code]:bg-sg-chip [&_code]:px-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5";
/** What the solution gave: its output, or the error it threw. */
const shownOutput = (f: FailedTest) => (f.output === "Error" && f.error ? f.error : f.output);
const list = (text: string) => text.split(",").map((s) => s.trim()).filter(Boolean);

/** Edits one problem: drafts save freely; publishing waits for a passing check (AIIN-107). */
export function ProblemEditor({ id, initial, status, checked, kits, history }: ProblemEditorProps) {
    const t = useTranslations("AdminProblems");
    const e = useTranslations("AdminProblems.editor");
    const router = useRouter();
    const [draft, setDraft] = useState(initial);
    const [saved, setSaved] = useState(initial);
    const [tagsText, setTagsText] = useState(initial.tags.join(", "));
    const [rolesText, setRolesText] = useState(initial.roles.join(", "));
    const [preview, setPreview] = useState(false);
    const [check, setCheck] = useState<Check>(null);
    const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
    const [busy, setBusy] = useState<"save" | "check" | "publish" | "archive" | null>(null);
    const [, startTransition] = useTransition();

    const current: ProblemDraft = { ...draft, tags: list(tagsText), roles: list(rolesText) };
    const dirty = JSON.stringify(current) !== JSON.stringify(saved);
    const coding = current.type === "CODING";
    const published = status === "PUBLISHED";
    const archived = status === "ARCHIVED";
    const passedNow = coding ? (!dirty && (checked || check?.passed === true)) : !dirty;

    const set = <K extends keyof ProblemDraft>(key: K, value: ProblemDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
    const setTest = (i: number, change: Partial<ProblemTest>) => set("tests", draft.tests.map((test, j) => (j === i ? { ...test, ...change } : test)));
    const moveTest = (i: number, by: number) => {
        const tests = [...draft.tests];
        [tests[i], tests[i + by]] = [tests[i + by], tests[i]];
        set("tests", tests);
    };

    const errorText = (result: { error?: string; errors?: readonly string[]; blocks?: readonly string[]; failed?: FailedTest | null }) => {
        if (result.error === "failsCheck" && result.failed) return e("errors.failsCheck", { n: result.failed.n, expected: result.failed.expected, output: shownOutput(result.failed) });
        const codes = result.errors ?? result.blocks ?? [result.error ?? "failed"];
        return codes.map((code) => (e.has(`errors.${code}`) ? e(`errors.${code}`) : e("errors.failed"))).join(" ");
    };

    /** Saves if there's anything to save; false when it couldn't. */
    async function save(): Promise<boolean> {
        if (!dirty) return true;
        const result = await saveProblem(id, current);
        if (result.error) {
            setMessage({ kind: "error", text: errorText(result) });
            return false;
        }
        setSaved(current);
        setCheck(null);
        return true;
    }

    const run = (kind: NonNullable<typeof busy>, work: () => Promise<void>) => {
        setBusy(kind);
        setMessage(null);
        startTransition(async () => {
            try {
                await work();
            } catch {
                setMessage({ kind: "error", text: e("errors.failed") });
            }
            setBusy(null);
            router.refresh();
        });
    };

    const onSave = () =>
        run("save", async () => {
            if (await save()) setMessage({ kind: "ok", text: e("saved") });
        });

    const onCheck = () =>
        run("check", async () => {
            if (!(await save())) return;
            const result = await checkProblem(id);
            if (result.error || !result.results) setMessage({ kind: "error", text: errorText(result) });
            else setCheck({ passed: !!result.passed, ms: result.ms ?? 0, results: result.results, failed: result.failed ?? null });
        });

    const onPublish = () =>
        run("publish", async () => {
            if (!(await save())) return;
            const result = await publishProblem(id);
            setMessage(result.error ? { kind: "error", text: errorText(result) } : { kind: "ok", text: e("published") });
        });

    const onArchive = () =>
        run("archive", async () => {
            const result = archived ? await restoreProblem(id) : await archiveProblem(id);
            setMessage(result.error ? { kind: "error", text: errorText(result) } : { kind: "ok", text: archived ? e("restored") : e("archived") });
        });

    const testResult = (i: number) => check?.results.find((r) => r.n === i + 1) ?? null;

    return (
        <>
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-2">
                    <Link href="/admin/problems" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        {e("back")}
                    </Link>
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] [overflow-wrap:anywhere] sm:text-[40px]">
                        {saved.title || "—"}
                    </h1>
                    <span className="flex flex-wrap items-center gap-2">
                        <StatusChip status={status} label={t(`statuses.${status as "DRAFT"}`)} />
                        <span className={cn(pill, "bg-sg-chip")}>
                            {e("meta", { type: t(`types.${saved.type as "CODING"}`), difficulty: t(`difficulties.${saved.difficulty as "EASY"}`), company: kits.find((k) => k.id === saved.kitId)?.company ?? "" })}
                        </span>
                        {dirty && <span className="text-sm font-semibold text-sg-muted">{e("unsaved")}</span>}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    <button type="button" onClick={onArchive} disabled={busy !== null} className={cn(outlineButton, "h-12 px-[18px] text-[15px]")}>
                        {archived ? <RotateCcw className="size-4" aria-hidden="true" /> : <Archive className="size-4" aria-hidden="true" />}
                        {archived ? e("restore") : e("archive")}
                    </button>
                    {!archived && (
                        <button type="button" onClick={onSave} disabled={busy !== null || !dirty} className={cn(outlineButton, "h-12 px-[18px] text-[15px]")}>
                            {busy === "save" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            {busy === "save" ? e("saving") : published ? e("saveChanges") : e("saveDraft")}
                        </button>
                    )}
                    {status === "DRAFT" && (
                        <button type="button" onClick={onPublish} disabled={busy !== null || (coding && !passedNow)} aria-describedby={coding && !passedNow ? "publish-why" : undefined} className={cn(coralButton, "h-12 px-6 text-base")}>
                            {busy === "publish" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            {busy === "publish" ? e("publishing") : e("publish")}
                        </button>
                    )}
                </div>
            </div>

            {message && (
                <p role={message.kind === "error" ? "alert" : "status"} className={cn(row, "flex items-start gap-2.5", message.kind === "error" && "text-sg-danger")}>
                    {message.kind === "error" ? <AlertCircle className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" /> : <Check className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />}
                    <span className="font-semibold">{message.text}</span>
                </p>
            )}

            <div className="flex flex-wrap items-start gap-5">
                <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
                    <section aria-labelledby="st-title" className={panel}>
                        <h2 id="st-title" className={panelTitle}>
                            {e("statement")}
                        </h2>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="pe-title" className={fieldLabel}>
                                {e("titleLabel")}
                            </label>
                            <Input id="pe-title" value={draft.title} maxLength={LIMITS.title} onChange={(ev) => set("title", ev.target.value)} className={fieldInput} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <label htmlFor="pe-body" className={fieldLabel}>
                                    {e("body")}
                                </label>
                                <span role="group" aria-label={e("view")} className="inline-flex rounded-full bg-sg-chip p-[3px]">
                                    {[false, true].map((on) => (
                                        <button
                                            key={String(on)}
                                            type="button"
                                            aria-pressed={preview === on}
                                            onClick={() => setPreview(on)}
                                            className={cn("h-8 rounded-full px-3.5 text-[13px] font-semibold", preview === on ? "bg-sg-ink text-sg-ink-foreground" : "text-sg-muted", focusRing)}
                                        >
                                            {on ? e("preview") : e("write")}
                                        </button>
                                    ))}
                                </span>
                            </div>
                            {preview ? (
                                <div className={cn(row, markdown, "min-h-[156px]")}>{draft.statement.trim() ? <ReactMarkdown>{draft.statement}</ReactMarkdown> : <p className="text-sg-muted">{e("previewEmpty")}</p>}</div>
                            ) : (
                                <textarea id="pe-body" rows={7} value={draft.statement} maxLength={LIMITS.statement} onChange={(ev) => set("statement", ev.target.value)} className={cn(area, mono)} />
                            )}
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
                            <label className={cn(fieldLabel, "flex flex-col gap-1.5")}>
                                {e("kit")}
                                <select value={draft.kitId} onChange={(ev) => set("kitId", ev.target.value)} className={selectField}>
                                    {kits.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.company}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={cn(fieldLabel, "flex flex-col gap-1.5")}>
                                {t("type")}
                                <select value={draft.type} onChange={(ev) => set("type", ev.target.value)} className={selectField}>
                                    {PROBLEM_TYPES.map((v) => (
                                        <option key={v} value={v}>
                                            {t(`types.${v}`)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className={cn(fieldLabel, "flex flex-col gap-1.5")}>
                                {t("difficulty")}
                                <select value={draft.difficulty} onChange={(ev) => set("difficulty", ev.target.value)} className={selectField}>
                                    {DIFFICULTIES.map((v) => (
                                        <option key={v} value={v}>
                                            {t(`difficulties.${v}`)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="pe-tags" className={fieldLabel}>
                                    {e("tags")}
                                </label>
                                <Input id="pe-tags" value={tagsText} onChange={(ev) => setTagsText(ev.target.value)} aria-describedby="pe-tags-hint" className={fieldInput} />
                                <span id="pe-tags-hint" className="text-[13px] text-sg-muted">
                                    {e("tagsHint")}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="pe-roles" className={fieldLabel}>
                                    {e("roles")}
                                </label>
                                <Input id="pe-roles" value={rolesText} onChange={(ev) => setRolesText(ev.target.value)} aria-describedby="pe-roles-hint" className={fieldInput} />
                                <span id="pe-roles-hint" className="text-[13px] text-sg-muted">
                                    {e("rolesHint")}
                                </span>
                            </div>
                        </div>
                        {coding ? (
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="pe-starter" className={fieldLabel}>
                                    {e("starter")}
                                </label>
                                <textarea id="pe-starter" rows={4} value={draft.starterCode} maxLength={LIMITS.code} onChange={(ev) => set("starterCode", ev.target.value)} spellCheck={false} className={cn(area, mono)} />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="pe-answer" className={fieldLabel}>
                                    {e("answer")}
                                </label>
                                <textarea id="pe-answer" rows={5} value={draft.answer} maxLength={LIMITS.answer} onChange={(ev) => set("answer", ev.target.value)} aria-describedby="pe-answer-hint" className={area} />
                                <span id="pe-answer-hint" className="text-[13px] text-sg-muted">
                                    {e("answerHint")}
                                </span>
                            </div>
                        )}
                    </section>

                    {coding && (
                        <section aria-labelledby="tc-title" className={panel}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 id="tc-title" className={panelTitle}>
                                    {e("testsTitle")}
                                </h2>
                                <span className={label}>{e("testsNote")}</span>
                            </div>
                            {draft.tests.length === 0 ? (
                                <p className="text-sg-muted">{e("noTestsYet")}</p>
                            ) : (
                                <ol className="flex flex-col gap-2">
                                    {draft.tests.map((test, i) => {
                                        const result = !dirty ? testResult(i) : null;
                                        return (
                                            <li key={i} className={cn(row, "flex flex-wrap items-center gap-x-2.5 gap-y-2")}>
                                                <span className="w-6 font-bold">{i + 1}</span>
                                                <Input
                                                    aria-label={e("input", { n: i + 1 })}
                                                    placeholder={e("inputPlaceholder")}
                                                    value={test.input}
                                                    maxLength={LIMITS.testField}
                                                    onChange={(ev) => setTest(i, { input: ev.target.value })}
                                                    spellCheck={false}
                                                    className={cn(fieldInput, mono, "h-11 min-w-[140px] flex-[2_1_160px]")}
                                                />
                                                <span aria-hidden="true" className="text-sg-muted">
                                                    →
                                                </span>
                                                <Input
                                                    aria-label={e("expected", { n: i + 1 })}
                                                    placeholder={e("expectedPlaceholder")}
                                                    value={test.expected}
                                                    maxLength={LIMITS.testField}
                                                    onChange={(ev) => setTest(i, { expected: ev.target.value })}
                                                    spellCheck={false}
                                                    className={cn(fieldInput, mono, "h-11 min-w-[100px] flex-[1_1_100px]")}
                                                />
                                                <button
                                                    type="button"
                                                    aria-pressed={test.hidden}
                                                    aria-label={e("hiddenToggle", { n: i + 1 })}
                                                    onClick={() => setTest(i, { hidden: !test.hidden })}
                                                    className={cn(pill, "h-9", test.hidden ? "border border-dashed border-sg-field-border" : "bg-sg-chip", focusRing)}
                                                >
                                                    {test.hidden ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
                                                    {test.hidden ? e("hidden") : e("visible")}
                                                </button>
                                                {result && (
                                                    <span className={cn(pill, result.passed ? "bg-sg-chip" : "bg-sg-danger/10 text-sg-danger")}>
                                                        {result.passed ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
                                                        {result.passed ? e("resultPassed") : e("resultFailed")}
                                                    </span>
                                                )}
                                                <span className="ml-auto flex items-center">
                                                    <button type="button" aria-label={e("up", { n: i + 1 })} disabled={i === 0} onClick={() => moveTest(i, -1)} className={cn(iconButton, "disabled:opacity-30")}>
                                                        <ArrowUp className="size-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label={e("down", { n: i + 1 })} disabled={i === draft.tests.length - 1} onClick={() => moveTest(i, 1)} className={cn(iconButton, "disabled:opacity-30")}>
                                                        <ArrowDown className="size-4" aria-hidden="true" />
                                                    </button>
                                                    <button type="button" aria-label={e("remove", { n: i + 1 })} onClick={() => set("tests", draft.tests.filter((_, j) => j !== i))} className={iconButton}>
                                                        <Trash2 className="size-4" aria-hidden="true" />
                                                    </button>
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                            <button
                                type="button"
                                disabled={draft.tests.length >= LIMITS.tests}
                                onClick={() => set("tests", [...draft.tests, { input: "", expected: "", hidden: false }])}
                                className={cn(outlineButton, "h-10 self-start text-sm")}
                            >
                                <Plus className="size-4" aria-hidden="true" />
                                {e("addTest")}
                            </button>
                        </section>
                    )}

                    <section aria-labelledby="h-title" className={panel}>
                        <div className="flex items-baseline justify-between gap-2">
                            <h2 id="h-title" className={panelTitle}>
                                {e("hintsTitle")}
                            </h2>
                            <span className={label}>{e("hintsCount", { count: draft.hints.length })}</span>
                        </div>
                        {draft.hints.map((hint, i) => (
                            <div key={i} className="flex flex-col gap-1.5">
                                <label htmlFor={`pe-h${i}`} className={fieldLabel}>
                                    {e("hintLabel", { n: i + 1 })}
                                </label>
                                <span className="flex items-center gap-1.5">
                                    <Input id={`pe-h${i}`} value={hint} maxLength={LIMITS.hint} onChange={(ev) => set("hints", draft.hints.map((h, j) => (j === i ? ev.target.value : h)))} className={fieldInput} />
                                    <button type="button" aria-label={e("removeHint", { n: i + 1 })} onClick={() => set("hints", draft.hints.filter((_, j) => j !== i))} className={iconButton}>
                                        <Trash2 className="size-4" aria-hidden="true" />
                                    </button>
                                </span>
                            </div>
                        ))}
                        <button type="button" disabled={draft.hints.length >= LIMITS.hints} onClick={() => set("hints", [...draft.hints, ""])} className={cn(outlineButton, "h-10 self-start text-sm disabled:opacity-40")}>
                            <Plus className="size-4" aria-hidden="true" />
                            {e("addHint")}
                        </button>
                    </section>
                </div>

                <aside className="flex max-w-[400px] min-w-[min(280px,100%)] flex-[1_1_300px] flex-col gap-4">
                    {coding && (
                        <section aria-labelledby="sol-title" className={cn(panel, "sg-shadow-lg")}>
                            <h2 id="sol-title" className={panelTitle}>
                                {e("checkTitle")}
                            </h2>
                            <p className="text-sg-muted">{e("checkBody")}</p>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="pe-solution" className={fieldLabel}>
                                    {e("solution")}
                                </label>
                                <textarea id="pe-solution" rows={9} value={draft.solutionCode} maxLength={LIMITS.code} onChange={(ev) => set("solutionCode", ev.target.value)} spellCheck={false} aria-describedby="pe-language" className={cn(area, mono)} />
                                <span id="pe-language" className="text-[13px] text-sg-muted">
                                    {e("languageNote")}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="pe-lang" className={fieldLabel}>
                                    {e("language")}
                                </label>
                                <select id="pe-lang" value={draft.language} onChange={(ev) => set("language", ev.target.value)} className={selectField}>
                                    {SOLUTION_LANGUAGES.map((l) => (
                                        <option key={l} value={l}>
                                            {e(`languages.${l}`)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="button" onClick={onCheck} disabled={busy !== null} aria-describedby={dirty ? "check-saves" : undefined} className={cn(inkButton, "h-12 self-start px-6")}>
                                {busy === "check" && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                {busy === "check" ? e("checking") : e("check")}
                            </button>
                            {dirty && (
                                <span id="check-saves" className="text-[13px] text-sg-muted">
                                    {e("checkSavesFirst")}
                                </span>
                            )}
                            {check && !dirty ? (
                                check.passed ? (
                                    <p role="status" className={cn(row, "flex flex-wrap items-center gap-2")}>
                                        <Check className="size-[18px] shrink-0" aria-hidden="true" />
                                        <strong>{e("allPassed", { count: check.results.length })}</strong>
                                        <span className="text-sg-muted">· {e("passedMeta", { language: e(`languages.${saved.language}`), ms: check.ms })}</span>
                                    </p>
                                ) : (
                                    check.failed && (
                                        <p role="alert" className={cn(row, "flex items-start gap-2")}>
                                            <AlertCircle className="mt-0.5 size-[18px] shrink-0 text-sg-danger" aria-hidden="true" />
                                            <span className="[overflow-wrap:anywhere]">
                                                <strong>{check.failed.hidden ? e("failedHidden", { n: check.failed.n }) : e("failedTitle", { n: check.failed.n })}</strong>
                                                {": "}
                                                {e("failedBody", { expected: check.failed.expected, output: shownOutput(check.failed) })}
                                            </span>
                                        </p>
                                    )
                                )
                            ) : (
                                <p id="publish-why" className="text-sm font-semibold text-sg-muted">
                                    {passedNow ? e("checkedNote") : e("uncheckedNote")}
                                </p>
                            )}
                        </section>
                    )}

                    <section aria-labelledby="hist-title" className={panel}>
                        <h2 id="hist-title" className={panelTitle}>
                            {e("history")}
                        </h2>
                        {history.length ? (
                            <ol className="flex flex-col">
                                {history.map((h) => (
                                    <li key={h.id} className="flex flex-col border-t border-sg-rule py-2.5 text-sm first:border-t-0">
                                        <span>
                                            <strong>{h.who}</strong> {h.what}
                                        </span>
                                        <span className="text-sg-muted">{h.when}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-sg-muted">{e("noHistory")}</p>
                        )}
                    </section>
                </aside>
            </div>
        </>
    );
}

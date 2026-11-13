"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Copy, Download, FileText, Loader2, Lock, Send, Users, X, XCircle } from "lucide-react";
import { importDriveCsv, previewDriveImport, type Preview } from "@/actions/drive-import";
import { FIELDS, MAX_BYTES, PROBLEMS, csvCell, type Field, type Mapping, type RowStatus } from "@/lib/drive-csv";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

const PAGE = 50;
const LOOK: Record<RowStatus, { icon: typeof Check; tone: string }> = {
    READY: { icon: CheckCircle2, tone: "text-sg-success" },
    INVALID_EMAIL: { icon: XCircle, tone: "text-sg-danger" },
    MISSING_NAME: { icon: XCircle, tone: "text-sg-danger" },
    DUPLICATE: { icon: Copy, tone: "text-sg-text" },
    IN_DRIVE: { icon: Users, tone: "text-sg-text" },
    STAFF: { icon: Lock, tone: "text-sg-danger" },
    UNKNOWN_COLLEGE: { icon: AlertTriangle, tone: "text-sg-text" },
};
const TEMPLATE = "data:text/csv;charset=utf-8," + encodeURIComponent("name,email,college,roll number,phone\nAsha Rao,asha.rao@example.edu,Your College,21CE1043,9800000000\n");

/** Invite a drive's candidates from a CSV (AIIN-166): upload, match columns, check every row, then invite. */
export function ImportFlow({ driveId }: { driveId: string }) {
    const t = useTranslations("DriveImport");
    const router = useRouter();
    const input = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [file, setFile] = useState<{ name: string; size: number; text: string } | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [mapping, setMapping] = useState<Mapping>([]);
    const [filter, setFilter] = useState<"problems" | "ready" | "all">("problems");
    const [page, setPage] = useState(0);
    const [addColleges, setAddColleges] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const fail = (code: string) => setError(t(`errors.${code}` as "errors.failed"));
    const run = (text: string, map: Mapping | null, next: 1 | 2) =>
        startTransition(async () => {
            setError(null);
            const r = await previewDriveImport(driveId, text, map).catch(() => ({ error: "failed" as const }));
            if ("error" in r) return fail(r.error);
            setPreview(r);
            setMapping(r.mapping);
            setPage(0);
            setFilter(r.total - r.counts.READY > 0 ? "problems" : "ready");
            setStep(next);
        });

    const choose = async (f: File | undefined) => {
        if (!f) return;
        setError(null);
        // Refused before reading, with the limit stated (AC6)
        if (!/\.csv$/i.test(f.name)) return fail("notCsv");
        if (f.size > MAX_BYTES) return fail("tooBig");
        const text = await f.text();
        setFile({ name: f.name, size: f.size, text });
        run(text, null, 1);
    };

    const problems = preview ? preview.total - preview.counts.READY : 0;
    const invitable = preview ? preview.counts.READY + (addColleges ? preview.counts.UNKNOWN_COLLEGE : 0) : 0;
    const shown = useMemo(() => {
        const rows = preview?.rows ?? [];
        return filter === "problems" ? rows.filter((r) => r.status !== "READY") : filter === "ready" ? rows.filter((r) => r.status === "READY") : rows;
    }, [preview, filter]);
    const mapOk = mapping.includes("email") && mapping.includes("name");

    const download = () => {
        if (!preview) return;
        const rows = preview.rows.filter((r) => r.status !== "READY");
        const csv = ["row,name,email,college,problem", ...rows.map((r) => [String(r.line), r.name, r.email, r.college, t(`status.${r.status}`)].map(csvCell).join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = "problem-rows.csv";
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const invite = () =>
        startTransition(async () => {
            if (!file) return;
            const r = await importDriveCsv(driveId, file.text, mapping, addColleges).catch(() => ({ error: "failed" as const }));
            if ("error" in r) return fail(r.error);
            toast.success(t("invited", { count: r.invited }));
            router.push(`/dashboard/drives/${driveId}`);
            router.refresh();
        });

    const pill = (on: boolean) =>
        cn(
            "inline-flex h-10 items-center gap-1.5 rounded-full border-2 px-3.5 text-sm font-semibold",
            on ? "border-sg-ink bg-sg-ink text-sg-ink-foreground" : "border-sg-glass-border bg-sg-row text-sg-text",
            focusRing,
        );
    const steps = [t("steps.upload"), t("steps.map"), t("steps.check"), t("steps.invite")];

    return (
        <div className="flex flex-col gap-6">
            <ol aria-label={t("stepsLabel")} className="flex flex-wrap gap-x-5 gap-y-2.5">
                {steps.map((s, i) => (
                    <li key={s} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-2", i === step ? "font-bold" : i < step ? "font-semibold" : "font-semibold text-sg-muted")}>
                        <span
                            className={cn(
                                "inline-flex size-7 items-center justify-center rounded-full text-[13px] font-bold",
                                i <= step ? "bg-sg-ink text-sg-ink-foreground" : "bg-sg-chip text-sg-muted",
                            )}
                        >
                            {i < step ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                        </span>
                        {s}
                        {i < step && <span className="sr-only">({t("done")})</span>}
                    </li>
                ))}
            </ol>

            {error && (
                <p role="alert" className="flex items-start gap-2 rounded-2xl bg-sg-chip px-4 py-3 text-sm font-semibold text-sg-danger">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {error}
                </p>
            )}

            <section aria-labelledby="ci-file" className={cn(panel, "gap-3")}>
                <h2 id="ci-file" className={panelTitle}>
                    {t("yourFile")}
                </h2>
                <input ref={input} id="ci-input" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => choose(e.target.files?.[0])} />
                {file ? (
                    <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                        <FileText className="size-5 shrink-0" aria-hidden="true" />
                        <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                            <strong className="break-all">{file.name}</strong>
                            <span className="text-[13px] text-sg-muted">
                                {preview ? t("fileMeta", { rows: preview.total, size: `${Math.max(1, Math.round(file.size / 1024))} KB` }) : t("reading")}
                            </span>
                        </span>
                        <button type="button" onClick={() => input.current?.click()} className={cn(outlineButton, "h-10 text-sm")}>
                            {t("chooseAnother")}
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={() => input.current?.click()} disabled={isPending} className={cn(outlineButton, "h-12 self-start px-5")}>
                        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileText className="size-4" aria-hidden="true" />}
                        {t("choose")}
                    </button>
                )}
                <span className="text-[13px] text-sg-muted">{t("limits")}</span>
                <a href={TEMPLATE} download="drive-candidates-template.csv" className={cn("inline-flex items-center gap-1.5 self-start rounded-md text-[15px] font-bold", focusRing)}>
                    {t("template")}
                    <Download className="size-3.5" aria-hidden="true" />
                </a>
            </section>

            {step === 1 && preview && (
                <>
                    <section aria-labelledby="ci-map" className={cn(panel, "gap-3")}>
                        <h2 id="ci-map" className={panelTitle}>
                            {t("matchTitle")}
                        </h2>
                        <p className="text-[13px] text-sg-muted">{t("matchHint")}</p>
                        {preview.headers.map((h, i) => (
                            <div key={i} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-[18px] bg-sg-row px-4 py-3">
                                <span className="flex min-w-0 flex-[1_1_180px] flex-col">
                                    <strong className="break-words">{h || "—"}</strong>
                                    {preview.samples[i] && <span className="text-[13px] break-words text-sg-muted">{t("example", { value: preview.samples[i] })}</span>}
                                </span>
                                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                                <label htmlFor={`ci-map-${i}`} className="sr-only">
                                    {t("useAs", { column: h })}
                                </label>
                                <select
                                    id={`ci-map-${i}`}
                                    value={mapping[i] ?? ""}
                                    onChange={(e) => {
                                        const v = (e.target.value || null) as Field | null;
                                        setMapping(mapping.map((m, k) => (k === i ? v : v && m === v ? null : m)));
                                    }}
                                    className={cn(field, "h-12 min-w-0 flex-[1_1_180px]")}
                                >
                                    <option value="">{t("fields.none")}</option>
                                    {FIELDS.map((f) => (
                                        <option key={f} value={f}>
                                            {t(`fields.${f}`)}
                                        </option>
                                    ))}
                                </select>
                                <span className={cn("inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-chip px-3 text-[13px] font-bold", mapping[i] ? "text-sg-success" : "text-sg-muted")}>
                                    {mapping[i] ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
                                    {mapping[i] ? t("matched") : t("skipped")}
                                </span>
                            </div>
                        ))}
                        {!mapOk && (
                            <p role="alert" className="text-[13px] font-semibold text-sg-danger">
                                {t("needNameEmail")}
                            </p>
                        )}
                    </section>
                    <div className="flex flex-wrap justify-end gap-2.5">
                        <button type="button" disabled={!mapOk || isPending} onClick={() => file && run(file.text, mapping, 2)} className={cn(coralButton, "h-12 px-6 text-base")}>
                            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                            {t("checkRows", { count: preview.total })}
                        </button>
                    </div>
                </>
            )}

            {step === 2 && preview && (
                <>
                    <section aria-labelledby="ci-check" className={cn(panel, "gap-3.5")}>
                        <h2 id="ci-check" className="sr-only">
                            {t("checkTitle")}
                        </h2>
                        <dl className="flex flex-wrap gap-x-6 gap-y-3">
                            {(["READY", ...PROBLEMS] as RowStatus[]).map((s) =>
                                s === "READY" || preview.counts[s] ? (
                                    <div key={s} className="flex min-w-[84px] flex-col">
                                        <dd className="font-display sg-soft order-1 text-[26px] leading-8 font-semibold">{preview.counts[s]}</dd>
                                        <dt className="order-2 text-[13px] text-sg-muted">{t(`counts.${s}`)}</dt>
                                    </div>
                                ) : null,
                            )}
                        </dl>
                        <nav aria-label={t("filter")} className="flex flex-wrap gap-2">
                            {problems > 0 && (
                                <button type="button" aria-pressed={filter === "problems"} onClick={() => (setFilter("problems"), setPage(0))} className={pill(filter === "problems")}>
                                    {t("withProblems", { count: problems })}
                                </button>
                            )}
                            <button type="button" aria-pressed={filter === "ready"} onClick={() => (setFilter("ready"), setPage(0))} className={pill(filter === "ready")}>
                                {t("ready", { count: preview.counts.READY })}
                            </button>
                            <button type="button" aria-pressed={filter === "all"} onClick={() => (setFilter("all"), setPage(0))} className={pill(filter === "all")}>
                                {t("allRows", { count: preview.total })}
                            </button>
                        </nav>
                        {shown.length === 0 ? (
                            <p className="text-sm text-sg-muted">{t("noneHere")}</p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {shown.slice(page * PAGE, page * PAGE + PAGE).map((r) => {
                                    const { icon: Icon, tone } = LOOK[r.status];
                                    return (
                                        <li key={r.line} className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-[18px] bg-sg-row px-4 py-3">
                                            <span className="w-14 text-[13px] text-sg-muted tabular-nums">{t("line", { n: r.line })}</span>
                                            <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                                                <strong className="break-words">{r.name || "—"}</strong>
                                                <span className="text-sm break-all text-sg-muted">{r.email || "—"}</span>
                                            </span>
                                            {r.college && <span className="min-w-0 flex-[1_1_160px] text-sm break-words">{r.college}</span>}
                                            <span className={cn("inline-flex min-h-[30px] max-w-full items-center gap-1.5 rounded-[15px] bg-sg-chip px-3 py-1 text-[13px] font-bold", tone)}>
                                                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                                                {t(`status.${r.status}`)}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                        {shown.length > PAGE && (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm text-sg-muted">
                                    {t("showing", { from: page * PAGE + 1, to: Math.min(shown.length, page * PAGE + PAGE), total: shown.length })}
                                </span>
                                <span className="flex gap-2">
                                    <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className={cn(outlineButton, "h-10 text-sm")}>
                                        {t("prev")}
                                    </button>
                                    <button type="button" disabled={(page + 1) * PAGE >= shown.length} onClick={() => setPage(page + 1)} className={cn(outlineButton, "h-10 text-sm")}>
                                        {t("next")}
                                    </button>
                                </span>
                            </div>
                        )}
                        {preview.unknownColleges.length > 0 && (
                            <fieldset className="flex flex-col gap-2.5 rounded-2xl bg-sg-lavender-soft px-4 py-3 text-sm text-sg-lavender-ink">
                                <legend className="sr-only">{t("addColleges")}</legend>
                                <p className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    {t("unknownNote", { count: preview.counts.UNKNOWN_COLLEGE, names: preview.unknownColleges.join(", ") })}
                                </p>
                                <span className="flex flex-wrap gap-2">
                                    <button type="button" aria-pressed={addColleges} onClick={() => setAddColleges(true)} className={pill(addColleges)}>
                                        {t("addColleges")}
                                    </button>
                                    <button type="button" aria-pressed={!addColleges} onClick={() => setAddColleges(false)} className={pill(!addColleges)}>
                                        {t("leaveOut")}
                                    </button>
                                </span>
                            </fieldset>
                        )}
                        {problems > 0 && (
                            <button type="button" onClick={download} className={cn("inline-flex items-center gap-1.5 self-start rounded-md text-[15px] font-bold", focusRing)}>
                                {t("downloadProblems", { count: problems })}
                                <Download className="size-3.5" aria-hidden="true" />
                            </button>
                        )}
                    </section>
                    <p className="text-[13px] text-sg-muted">{t("sendNote")}</p>
                    <div className="flex flex-wrap justify-end gap-2.5">
                        <button type="button" onClick={() => setStep(1)} className={cn(outlineButton, "h-12 px-5")}>
                            {t("back")}
                        </button>
                        <button type="button" disabled={invitable === 0 || isPending} onClick={invite} className={cn(coralButton, "h-12 px-6 text-base")}>
                            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                            {t("invite", { count: invitable })}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

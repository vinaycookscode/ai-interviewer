"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, UserCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { bulkInviteCandidates, type BulkInviteResult, type CandidateData } from "@/actions/bulk-invite";
import { field, fieldLabel, glassButton, inkButton, outlineButton, textLink } from "@/components/jobs/employer-ui";
import { Dialog, DialogClose, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";

// Stricter than the browser's check: valid local part, a domain with a dot, no consecutive dots.
function validateEmail(email: string): boolean {
    const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (email.includes("..")) return false;
    return emailRegex.test(email);
}

type RowProblem = "missingName" | "missingEmail" | "badEmail" | "alreadyInvited";

interface ParsedCandidate {
    name: string;
    email: string;
    problem?: RowProblem;
}

type HeaderError = "tooShort" | "noName" | "noEmail";

// Parse the CSV; every row is kept with what's wrong with it, if anything.
function parseCSV(content: string, invited: Set<string>): { candidates: ParsedCandidate[]; headerError: HeaderError | null } {
    const lines = content.trim().split(/\r?\n/);
    const candidates: ParsedCandidate[] = [];

    if (lines.length < 2) return { candidates, headerError: "tooShort" };

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const nameIndex = header.findIndex((h) => h === "name" || h === "candidate name" || h === "full name");
    const emailIndex = header.findIndex((h) => h === "email" || h === "email address" || h === "candidate email");

    if (nameIndex === -1) return { candidates, headerError: "noName" };
    if (emailIndex === -1) return { candidates, headerError: "noEmail" };

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const name = values[nameIndex] || "";
        const email = values[emailIndex] || "";

        if (!name) candidates.push({ name: "", email, problem: "missingName" });
        else if (!email) candidates.push({ name, email: "", problem: "missingEmail" });
        else if (!validateEmail(email)) candidates.push({ name, email, problem: "badEmail" });
        else if (invited.has(email.toLowerCase())) candidates.push({ name, email, problem: "alreadyInvited" });
        else candidates.push({ name, email });
    }

    return { candidates, headerError: null };
}

const TEMPLATE = "name,email\nPriya Sharma,priya.s@example.com\nRohan Desai,rohan.d@example.com\n";
const TEMPLATE_HREF = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`;
const PREVIEW_LIMIT = 50;

type Step = "upload" | "preview" | "schedule" | "sending" | "results";
const STEPS = ["upload", "preview", "schedule", "results"] as const;

// Earliest start: an hour from now.
function getMinDateTime() {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
}

interface BulkInviteDialogProps {
    jobId: string;
    /** Emails already invited to this job (lower case), marked "Already invited" in the check step. */
    invitedEmails?: string[];
}

export function BulkInviteDialog({ jobId, invitedEmails = [] }: BulkInviteDialogProps) {
    const t = useTranslations("Employer.bulk");
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>("upload");
    const [allCandidates, setAllCandidates] = useState<ParsedCandidate[]>([]);
    const [headerError, setHeaderError] = useState<HeaderError | null>(null);
    const [dragging, setDragging] = useState(false);
    const [scheduledTime, setScheduledTime] = useState("");
    const [expiresAt, setExpiresAt] = useState("");
    const [result, setResult] = useState<BulkInviteResult | null>(null);

    const ready = allCandidates.filter((c) => !c.problem);
    const alreadyInvited = allCandidates.filter((c) => c.problem === "alreadyInvited");
    const invalid = allCandidates.filter((c) => c.problem && c.problem !== "alreadyInvited");
    const skipped = allCandidates.length - ready.length;

    function readFile(file: File | undefined) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = (e.target?.result as string) ?? "";
            const parsed = parseCSV(content, new Set(invitedEmails));
            setAllCandidates(parsed.candidates);
            setHeaderError(parsed.headerError);
            setStep("preview");
        };
        reader.readAsText(file);
    }

    async function handleSendInvites() {
        if (!scheduledTime || ready.length === 0) return;
        setStep("sending");
        try {
            const candidatesToSend: CandidateData[] = ready.map((c) => ({ name: c.name, email: c.email }));
            const res = await bulkInviteCandidates({
                jobId,
                candidates: candidatesToSend,
                scheduledTime: new Date(scheduledTime).toISOString(),
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            });
            setResult(res);
            router.refresh();
        } catch (error) {
            console.error("Bulk invite failed:", error);
            setResult({ success: false, total: ready.length, successful: 0, failed: ready.length, duplicates: 0, results: [] });
        }
        setStep("results");
    }

    function resetDialog() {
        setStep("upload");
        setAllCandidates([]);
        setHeaderError(null);
        setScheduledTime("");
        setExpiresAt("");
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleOpenChange(isOpen: boolean) {
        // Don't let the dialog close mid-send.
        if (!isOpen && step === "sending") return;
        setOpen(isOpen);
        if (!isOpen) resetDialog();
    }

    const titles: Record<Step, string> = {
        upload: t("titleUpload"),
        preview: t("titleCheck"),
        schedule: t("titleSchedule"),
        sending: t("titleSending"),
        results: t("titleDone"),
    };
    const stepIndex = step === "sending" ? 3 : STEPS.indexOf(step as (typeof STEPS)[number]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger className={cn(glassButton, "h-12")}>
                <Upload className="size-5" aria-hidden="true" />
                {t("trigger")}
            </DialogTrigger>

            <DialogPanel title={titles[step]} closeLabel={t("close")} className={step === "preview" ? "max-w-[600px]" : "max-w-[560px]"}>
                <ol aria-label={t("stepsLabel")} className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {STEPS.map((s, i) => {
                        const current = i === stepIndex;
                        const done = i < stepIndex;
                        return (
                            <li
                                key={s}
                                aria-current={current ? "step" : undefined}
                                className={cn("flex items-center gap-1.5 text-sm", current ? "font-bold" : "font-medium", !current && !done && "text-sg-muted")}
                            >
                                <span
                                    className={cn(
                                        "inline-flex size-[22px] items-center justify-center rounded-full text-xs font-bold",
                                        current ? "bg-sg-ink text-sg-ink-foreground" : done ? "bg-sg-lavender-soft text-sg-lavender-ink" : "bg-sg-chip"
                                    )}
                                >
                                    {i + 1}
                                </span>
                                {t(`step.${s}`)}
                                {done && <span className="sr-only"> {t("stepDone")}</span>}
                            </li>
                        );
                    })}
                </ol>

                {step === "upload" && (
                    <>
                        <label
                            htmlFor="bk-file"
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragging(true);
                            }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragging(false);
                                readFile(e.dataTransfer.files?.[0]);
                            }}
                            className={cn(
                                "flex cursor-pointer flex-col items-center gap-2 rounded-[20px] border-2 border-dashed px-4 py-7 text-center transition-colors focus-within:ring-[3px] focus-within:ring-sg-lavender/50",
                                dragging ? "border-sg-lavender bg-sg-lavender-soft" : "border-sg-field-border"
                            )}
                        >
                            <FileSpreadsheet className="size-8 text-sg-muted" aria-hidden="true" />
                            <span className="font-bold">{t("choose")}</span>
                            <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{t("columns")}</span>
                            <input
                                ref={fileInputRef}
                                id="bk-file"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => readFile(e.target.files?.[0])}
                                className="sr-only"
                            />
                        </label>
                        <pre className="overflow-x-auto rounded-2xl bg-sg-row px-3.5 py-3 font-mono text-[13px] leading-5">{TEMPLATE.trim()}</pre>
                        <a href={TEMPLATE_HREF} download="candidates-template.csv" className={cn(textLink, "inline-flex items-center gap-1.5 self-start")}>
                            <Download className="size-4" aria-hidden="true" />
                            {t("template")}
                        </a>
                    </>
                )}

                {step === "preview" && (
                    <>
                        {headerError ? (
                            <p role="alert" className="flex items-start gap-2.5 rounded-2xl bg-sg-danger/10 px-4 py-3 text-sm font-semibold text-sg-danger">
                                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                {t(`header.${headerError}`)}
                            </p>
                        ) : (
                            <>
                                <p>
                                    <strong>{t("readyOf", { ready: ready.length, total: allCandidates.length })}</strong>
                                    {skipped > 0 && <span className="text-sg-muted"> {t("skipNote", { count: skipped })}</span>}
                                </p>
                                <div className="max-h-[260px] overflow-auto rounded-2xl bg-sg-row">
                                    <table className="w-full min-w-[440px] border-collapse text-sm">
                                        <thead>
                                            <tr>
                                                <th scope="col" className="px-3 py-2.5 text-left text-[13px] font-bold text-sg-muted">
                                                    {t("colName")}
                                                </th>
                                                <th scope="col" className="px-3 py-2.5 text-left text-[13px] font-bold text-sg-muted">
                                                    {t("colEmail")}
                                                </th>
                                                <th scope="col" className="px-3 py-2.5 text-left text-[13px] font-bold text-sg-muted">
                                                    {t("colCheck")}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allCandidates.slice(0, PREVIEW_LIMIT).map((c, i) => (
                                                <tr key={i} className="border-t border-sg-rule">
                                                    <td className="px-3 py-2.5 font-semibold break-words">{c.name || "—"}</td>
                                                    <td className="px-3 py-2.5 break-all">{c.email || "—"}</td>
                                                    <td className="px-3 py-2.5">
                                                        <RowCheck problem={c.problem} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {allCandidates.length > PREVIEW_LIMIT && (
                                        <p className="border-t border-sg-rule px-3 py-2 text-sm text-sg-muted">
                                            {t("more", { count: allCandidates.length - PREVIEW_LIMIT })}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                        <div className="flex justify-between gap-2.5">
                            <button type="button" onClick={resetDialog} className={cn(outlineButton, "h-12 px-5 text-base")}>
                                {t("back")}
                            </button>
                            {!headerError && (
                                <button
                                    type="button"
                                    onClick={() => setStep("schedule")}
                                    disabled={ready.length === 0}
                                    className={cn(inkButton, "h-12")}
                                >
                                    {t("continueWith", { count: ready.length })}
                                </button>
                            )}
                        </div>
                    </>
                )}

                {step === "schedule" && (
                    <>
                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="bk-start" className={fieldLabel}>
                                {t("startFrom")}
                            </label>
                            <input
                                id="bk-start"
                                type="datetime-local"
                                required
                                min={getMinDateTime()}
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className={cn(field, "h-12")}
                            />
                        </div>
                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="bk-end" className={fieldLabel}>
                                {t("expires")}
                            </label>
                            <input
                                id="bk-end"
                                type="datetime-local"
                                min={scheduledTime || getMinDateTime()}
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                aria-describedby="bk-end-hint"
                                className={cn(field, "h-12")}
                            />
                            <span id="bk-end-hint" className="text-[13px] leading-[18px] font-medium text-sg-muted">
                                {t("expiresHint")}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2.5">
                            <button type="button" onClick={() => setStep("preview")} className={cn(outlineButton, "h-12 px-5 text-base")}>
                                {t("back")}
                            </button>
                            <button type="button" onClick={handleSendInvites} disabled={!scheduledTime} className={cn(inkButton, "h-12")}>
                                {t("send", { count: ready.length })}
                            </button>
                        </div>
                    </>
                )}

                {step === "sending" && (
                    <p role="status" className="flex items-center justify-center gap-3 py-8 font-semibold">
                        <Loader2 className="size-6 animate-spin" aria-hidden="true" />
                        {t("sending", { count: ready.length })}
                    </p>
                )}

                {step === "results" && result && (
                    <>
                        <div role="status" className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-3">
                            <Stat value={result.successful} label={t("statSent")} />
                            <Stat value={result.duplicates + alreadyInvited.length} label={t("statAlready")} />
                            <Stat value={result.failed + invalid.length} label={t("statFailed")} />
                        </div>
                        {(invalid.length > 0 || result.results.some((r) => r.status === "failed")) && (
                            <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto text-[15px]">
                                {invalid.map((c, i) => (
                                    <li key={`invalid-${i}`} className="flex gap-2">
                                        <XCircle className="mt-[3px] size-4 shrink-0 text-sg-danger" aria-hidden="true" />
                                        <span className="min-w-0 break-words">
                                            <strong>{c.email || c.name || t("emptyRow")}</strong> {t(`reason.${c.problem}`)}
                                        </span>
                                    </li>
                                ))}
                                {result.results
                                    .filter((r) => r.status === "failed")
                                    .map((r, i) => (
                                        <li key={`failed-${i}`} className="flex gap-2">
                                            <XCircle className="mt-[3px] size-4 shrink-0 text-sg-danger" aria-hidden="true" />
                                            <span className="min-w-0 break-words">
                                                <strong>{r.email}</strong> {r.error || t("reason.sendFailed")}
                                            </span>
                                        </li>
                                    ))}
                            </ul>
                        )}
                        <DialogClose className={cn(inkButton, "h-12 self-end")}>{t("done")}</DialogClose>
                    </>
                )}
            </DialogPanel>
        </Dialog>
    );
}

function RowCheck({ problem }: { problem?: RowProblem }) {
    const t = useTranslations("Employer.bulk");
    if (!problem) {
        return (
            <span className="inline-flex items-center gap-1.5 font-bold text-sg-success">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {t("ready")}
            </span>
        );
    }
    if (problem === "alreadyInvited") {
        return (
            <span className="inline-flex items-center gap-1.5 font-bold text-sg-muted">
                <UserCheck className="size-4" aria-hidden="true" />
                {t("check.alreadyInvited")}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 font-bold text-sg-danger">
            <XCircle className="size-4 shrink-0" aria-hidden="true" />
            {t(`check.${problem}`)}
        </span>
    );
}

function Stat({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col rounded-2xl bg-sg-row p-3.5">
            <span className="font-display sg-soft text-[28px] font-semibold">{value}</span>
            <span className="text-[13px] leading-[18px] font-medium text-sg-muted">{label}</span>
        </div>
    );
}


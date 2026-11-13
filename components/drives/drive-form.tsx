"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Check, Loader2, Lock, Plus, X } from "lucide-react";
import { saveDrive } from "@/actions/drives";
import { CITY_MAX, COLLEGE_MAX, NAME_MAX, type CollegeInput, type DriveError, type DriveField, type DriveFormValues } from "@/lib/drives";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, fieldLabel, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** New drive / edit drive (AIIN-165), from the approved "New drive" artboards. Dates are typed in India time. */
export function DriveForm({
    id,
    initial,
    jobs,
    locked,
}: {
    id: string | null;
    initial: DriveFormValues;
    jobs: { id: string; title: string; questions: number }[];
    /** A drive with candidates stays on its job and can't go back to draft */
    locked: boolean;
}) {
    const t = useTranslations("Drives");
    const router = useRouter();
    const [v, setV] = useState<DriveFormValues>(initial);
    const [errors, setErrors] = useState<Partial<Record<DriveField, DriveError>>>({});
    const [noQuestions, setNoQuestions] = useState(false);
    const [isPending, startTransition] = useTransition();
    const job = jobs.find((j) => j.id === v.jobId);

    const submit = (draft: boolean) =>
        startTransition(async () => {
            setNoQuestions(false);
            const r = await saveDrive(id, { ...v, draft }).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) {
                router.push(`/dashboard/drives/${r.id}`);
                router.refresh();
            } else if ("errors" in r) setErrors(r.errors);
            else if (r.error === "noQuestions") setNoQuestions(true);
            else toast.error(t("failed"));
        });

    const err = (f: DriveField) => (errors[f] ? t(`errors.${errors[f]}`) : null);
    const input = (f: "name" | "opensAt" | "closesAt" | "interviewCutoff", props: React.InputHTMLAttributes<HTMLInputElement>, hint?: string) => (
        <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-1.5">
            <label htmlFor={`df-${f}`} className={fieldLabel}>
                {t(f === "interviewCutoff" ? "interviewCutoff" : f)}
            </label>
            <input
                id={`df-${f}`}
                value={v[f]}
                onChange={(e) => setV({ ...v, [f]: e.target.value })}
                aria-invalid={!!errors[f]}
                aria-describedby={errors[f] ? `df-${f}-e` : hint ? `df-${f}-h` : undefined}
                className={cn(field, "h-12")}
                {...props}
            />
            {errors[f] ? (
                <span id={`df-${f}-e`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sg-danger">
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                    {err(f)}
                </span>
            ) : (
                hint && (
                    <span id={`df-${f}-h`} className="text-[13px] text-sg-muted">
                        {hint}
                    </span>
                )
            )}
        </div>
    );
    const setCollege = (i: number, patch: Partial<CollegeInput>) => setV({ ...v, colleges: v.colleges.map((c, k) => (k === i ? { ...c, ...patch } : c)) });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                submit(false);
            }}
            className="flex flex-col gap-6"
            noValidate
        >
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <section className={cn(panel, "gap-4")} aria-labelledby="df-basics">
                    <h2 id="df-basics" className={panelTitle}>
                        {t("basics")}
                    </h2>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="df-job" className={fieldLabel}>
                            {t("job")}
                        </label>
                        <select
                            id="df-job"
                            value={v.jobId}
                            disabled={locked}
                            onChange={(e) => setV({ ...v, jobId: e.target.value })}
                            aria-invalid={!!errors.jobId || noQuestions}
                            className={cn(field, "h-12")}
                        >
                            {jobs.map((j) => (
                                <option key={j.id} value={j.id}>
                                    {j.title}
                                </option>
                            ))}
                        </select>
                        {noQuestions || job?.questions === 0 ? (
                            <span role={noQuestions ? "alert" : undefined} className="inline-flex flex-wrap items-center gap-1.5 text-[13px] font-semibold text-sg-danger">
                                <AlertTriangle className="size-3.5" aria-hidden="true" />
                                {t("noQuestions")}
                                <Link href={`/dashboard/jobs/${v.jobId}/edit`} className={cn("rounded-md underline", focusRing)}>
                                    {t("editJob")}
                                </Link>
                            </span>
                        ) : (
                            <span className="text-[13px] text-sg-muted">{locked ? t("jobLocked") : t("questionsReady", { count: job?.questions ?? 0 })}</span>
                        )}
                    </div>
                    <div className="flex">{input("name", { maxLength: NAME_MAX, placeholder: t("namePlaceholder"), required: true })}</div>
                    <div className="flex flex-wrap items-start gap-3">
                        {input("opensAt", { type: "datetime-local" }, t("ist"))}
                        {input("closesAt", { type: "datetime-local" }, t("ist"))}
                    </div>
                </section>

                <div className="flex flex-col gap-6">
                    <section className={cn(panel, "gap-3")} aria-labelledby="df-colleges">
                        <h2 id="df-colleges" className={panelTitle}>
                            {t("collegesTitle")}
                        </h2>
                        <p className="text-[13px] text-sg-muted">{t("collegesHint")}</p>
                        {v.colleges.map((c, i) => (
                            <fieldset key={c.id ?? `new-${i}`} className="flex flex-col gap-3 rounded-[18px] bg-sg-row p-4">
                                <legend className="sr-only">{t("collegeN", { n: i + 1 })}</legend>
                                <div className="flex items-end gap-2">
                                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                        <label htmlFor={`dc-${i}-name`} className={fieldLabel}>
                                            {t("collegeName")}
                                        </label>
                                        <input id={`dc-${i}-name`} value={c.name} maxLength={COLLEGE_MAX} onChange={(e) => setCollege(i, { name: e.target.value })} className={cn(field, "h-12")} />
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={t("removeCollege", { name: c.name || t("collegeN", { n: i + 1 }) })}
                                        onClick={() => setV({ ...v, colleges: v.colleges.filter((_, k) => k !== i) })}
                                        className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-sg-chip", focusRing)}
                                    >
                                        <X className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex min-w-0 flex-[1_1_140px] flex-col gap-1.5">
                                        <label htmlFor={`dc-${i}-city`} className={fieldLabel}>
                                            {t("city")}
                                        </label>
                                        <input id={`dc-${i}-city`} value={c.city ?? ""} maxLength={CITY_MAX} placeholder={t("optional")} onChange={(e) => setCollege(i, { city: e.target.value })} className={cn(field, "h-12")} />
                                    </div>
                                    <div className="flex min-w-0 flex-[2_1_220px] flex-col gap-1.5">
                                        <label htmlFor={`dc-${i}-po`} className={fieldLabel}>
                                            {t("officer")}
                                        </label>
                                        <input
                                            id={`dc-${i}-po`}
                                            type="email"
                                            value={c.placementOfficerEmail ?? ""}
                                            placeholder={t("optional")}
                                            onChange={(e) => setCollege(i, { placementOfficerEmail: e.target.value })}
                                            className={cn(field, "h-12")}
                                        />
                                    </div>
                                </div>
                            </fieldset>
                        ))}
                        {errors.colleges && (
                            <p role="alert" className="text-[13px] font-semibold text-sg-danger">
                                {t("collegesError")}
                            </p>
                        )}
                        <button type="button" onClick={() => setV({ ...v, colleges: [...v.colleges, { name: "" }] })} className={cn(outlineButton, "h-10 self-start text-sm")}>
                            <Plus className="size-4" aria-hidden="true" />
                            {t("addCollege")}
                        </button>
                    </section>

                    <section className={cn(panel, "gap-4")} aria-labelledby="df-cut">
                        <h2 id="df-cut" className={panelTitle}>
                            {t("cutoffs")}
                        </h2>
                        <div className="flex items-start justify-between gap-4">
                            <span className="flex min-w-0 flex-col">
                                <span id="df-auto-l" className="font-semibold">
                                    {t("autoShortlist")}
                                </span>
                                <span id="df-auto-h" className="text-[13px] text-sg-muted">
                                    {t("autoShortlistHint")}
                                </span>
                            </span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={v.autoShortlist}
                                aria-labelledby="df-auto-l"
                                aria-describedby="df-auto-h"
                                onClick={() => setV({ ...v, autoShortlist: !v.autoShortlist })}
                                className={cn(
                                    "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors",
                                    v.autoShortlist ? "border-sg-ink bg-sg-ink" : "border-sg-field-border bg-sg-chip",
                                    focusRing,
                                )}
                            >
                                <span className={cn("absolute size-6 rounded-full bg-sg-bg shadow transition-transform", v.autoShortlist ? "translate-x-[26px]" : "translate-x-[2px]")} />
                            </button>
                        </div>
                        {(v.autoShortlist || v.interviewCutoff) && <div className="flex">{input("interviewCutoff", { inputMode: "decimal", maxLength: 4 }, t("cutoffHint"))}</div>}
                        <p className="flex items-start gap-2.5 rounded-2xl bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {t("linksNote")}
                        </p>
                    </section>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
                {!locked && (
                    <button type="button" disabled={isPending} onClick={() => submit(true)} className={cn(outlineButton, "h-12 px-5")}>
                        {t("saveDraft")}
                    </button>
                )}
                <button type="submit" disabled={isPending} className={cn(coralButton, "h-12 px-6 text-base")}>
                    {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                    {t("save")}
                </button>
            </div>
        </form>
    );
}

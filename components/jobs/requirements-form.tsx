"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Loader2, Plus, Sparkles, X } from "lucide-react";
import { proposeJobRequirements, saveJobRequirements } from "@/actions/job-requirements";
import { normalizeSkill } from "@/lib/skills";
import { SKILLS_MAX, WORK_MODES, type Requirements } from "@/lib/job-requirements";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

interface Skill {
    name: string;
    must: boolean;
}
const LAKH = 100_000;
const num = (v: string) => (v.trim() === "" ? null : Number(v));
const lakhs = (v: string) => (v.trim() === "" ? null : Math.round(Number(v) * LAKH));
const toSkills = (r: Requirements): Skill[] => [
    ...r.mustHaveSkills.map((name) => ({ name, must: true })),
    ...r.niceToHaveSkills.map((name) => ({ name, must: false })),
];

/** Confirm a job's requirements (AIIN-192). U proposes them; nothing counts until the employer confirms. */
export function RequirementsForm({
    jobId,
    eyebrow,
    saved,
    propose,
    publish,
}: {
    jobId: string;
    eyebrow: string;
    saved: Requirements;
    propose: boolean;
    publish: boolean;
}) {
    const t = useTranslations("Employer.requirements");
    const router = useRouter();
    const [skills, setSkills] = useState<Skill[]>(toSkills(saved));
    const [adding, setAdding] = useState("");
    const [role, setRole] = useState({
        minYears: saved.minYears?.toString() ?? "",
        maxYears: saved.maxYears?.toString() ?? "",
        workMode: saved.workMode ?? "",
        location: saved.location ?? "",
        salaryMin: saved.salaryMin ? String(saved.salaryMin / LAKH) : "",
        salaryMax: saved.salaryMax ? String(saved.salaryMax / LAKH) : "",
        maxNoticeDays: saved.maxNoticeDays?.toString() ?? "",
    });
    const [ai, setAi] = useState<"idle" | "loading" | "proposed" | "failed">(propose ? "loading" : "idle");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const asked = useRef(false);

    const ask = async () => {
        setAi("loading");
        const r = await proposeJobRequirements(jobId).catch(() => ({ error: "unavailable" as const }));
        if ("ok" in r) {
            const p = r.ok;
            setSkills(toSkills(p));
            setRole({
                minYears: p.minYears?.toString() ?? "",
                maxYears: p.maxYears?.toString() ?? "",
                workMode: p.workMode ?? "",
                location: p.location ?? "",
                salaryMin: p.salaryMin ? String(p.salaryMin / LAKH) : "",
                salaryMax: p.salaryMax ? String(p.salaryMax / LAKH) : "",
                maxNoticeDays: p.maxNoticeDays?.toString() ?? "",
            });
            setAi("proposed");
        } else setAi("failed");
    };
    useEffect(() => {
        if (propose && !asked.current) {
            asked.current = true;
            void ask();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const add = () => {
        const name = normalizeSkill(adding);
        if (!name || skills.some((s) => s.name.toLowerCase() === name.toLowerCase()) || skills.length >= SKILLS_MAX) return;
        setSkills([...skills, { name, must: true }]);
        setAdding("");
    };

    const confirm = () =>
        startTransition(async () => {
            setError(null);
            const input = {
                mustHaveSkills: skills.filter((s) => s.must).map((s) => s.name),
                niceToHaveSkills: skills.filter((s) => !s.must).map((s) => s.name),
                minYears: num(role.minYears),
                maxYears: num(role.maxYears),
                workMode: role.workMode || null,
                location: role.location,
                salaryMin: lakhs(role.salaryMin),
                salaryMax: lakhs(role.salaryMax),
                maxNoticeDays: num(role.maxNoticeDays),
            };
            const r = await saveJobRequirements(jobId, input, publish).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) {
                router.push(`/dashboard/jobs/${jobId}`);
                router.refresh();
            } else setError(t(`errors.${r.error}`));
        });

    const pill = (on: boolean) =>
        cn("h-9 rounded-full px-3.5 text-[13px] font-bold", on ? "bg-sg-ink text-sg-ink-foreground" : "border border-sg-field-border text-sg-text", focusRing);

    return (
        <div className="flex flex-col gap-6">
            <p className="text-[13px] font-bold text-sg-muted">{eyebrow}</p>
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <section aria-labelledby="rq-skills" className={cn(panel, "gap-3 sm:p-7")}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 id="rq-skills" className={panelTitle}>
                            {t("skills")}
                        </h2>
                        {ai === "proposed" && (
                            <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-sg-lavender-soft px-3 text-[13px] font-bold text-sg-lavender-ink">
                                <Sparkles className="size-3.5" aria-hidden="true" />
                                {t("proposed")}
                            </span>
                        )}
                    </div>
                    {ai === "loading" ? (
                        <div role="status" aria-live="polite" className="flex flex-col gap-2">
                            <span className="sr-only">{t("proposing")}</span>
                            {[0, 1, 2].map((i) => (
                                <div key={i} aria-hidden="true" className="flex items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3.5">
                                    <span className="h-4 w-2/5 rounded-full bg-sg-chip" />
                                    <span className="ml-auto h-8 w-40 rounded-full bg-sg-chip" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {ai === "failed" && (
                                <p
                                    role="status"
                                    className="flex items-start gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink"
                                >
                                    <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    {t("aiFailed")}
                                </p>
                            )}
                            {skills.length === 0 && ai !== "failed" && <p className="text-sm text-sg-muted">{t("noSkills")}</p>}
                            <ul className="flex flex-col gap-2">
                                {skills.map((s, i) => (
                                    <li key={s.name} className="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-sg-row px-4 py-3">
                                        <span className="min-w-0 flex-[1_1_140px] font-bold break-words">{s.name}</span>
                                        <span role="group" aria-label={s.name} className="flex gap-1.5">
                                            {[true, false].map((must) => (
                                                <button
                                                    key={String(must)}
                                                    type="button"
                                                    aria-pressed={s.must === must}
                                                    onClick={() => setSkills(skills.map((x, j) => (j === i ? { ...x, must } : x)))}
                                                    className={pill(s.must === must)}
                                                >
                                                    {must ? t("mustHave") : t("niceToHave")}
                                                </button>
                                            ))}
                                        </span>
                                        <button
                                            type="button"
                                            aria-label={t("remove", { skill: s.name })}
                                            onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                                            className={cn(
                                                "inline-flex size-9 items-center justify-center rounded-full text-sg-muted hover:bg-sg-chip",
                                                focusRing,
                                            )}
                                        >
                                            <X className="size-4" aria-hidden="true" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    add();
                                }}
                                className="flex flex-wrap gap-2"
                            >
                                <label htmlFor="rq-add" className="sr-only">
                                    {t("addSkill")}
                                </label>
                                <input
                                    id="rq-add"
                                    value={adding}
                                    maxLength={40}
                                    onChange={(e) => setAdding(e.target.value)}
                                    placeholder={t("addSkill")}
                                    className={cn(field, "h-12 min-w-0 flex-[1_1_180px]")}
                                />
                                <button type="submit" disabled={skills.length >= SKILLS_MAX} className={cn(outlineButton, "h-12 text-[15px]")}>
                                    <Plus className="size-4" aria-hidden="true" />
                                    {t("add")}
                                </button>
                            </form>
                            <button type="button" onClick={ask} className={cn("inline-flex items-center gap-1.5 self-start text-sm font-bold", focusRing)}>
                                <Sparkles className="size-4" aria-hidden="true" />
                                {ai === "idle" ? t("askU") : t("askAgain")}
                            </button>
                        </>
                    )}
                </section>

                <section aria-labelledby="rq-role" className={cn(panel, "gap-4 sm:p-7")}>
                    <h2 id="rq-role" className={panelTitle}>
                        {t("role")}
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3.5">
                        <fieldset className="flex flex-col gap-1.5">
                            <legend className="mb-1.5 text-sm font-semibold">{t("years")}</legend>
                            <span className="flex items-center gap-2">
                                <label htmlFor="rq-min" className="sr-only">
                                    {t("from")}
                                </label>
                                <input
                                    id="rq-min"
                                    inputMode="numeric"
                                    value={role.minYears}
                                    onChange={(e) => setRole({ ...role, minYears: e.target.value.replace(/\D/g, "") })}
                                    placeholder={t("from")}
                                    className={cn(field, "h-12 min-w-0")}
                                />
                                <span aria-hidden="true">–</span>
                                <label htmlFor="rq-max" className="sr-only">
                                    {t("to")}
                                </label>
                                <input
                                    id="rq-max"
                                    inputMode="numeric"
                                    value={role.maxYears}
                                    onChange={(e) => setRole({ ...role, maxYears: e.target.value.replace(/\D/g, "") })}
                                    placeholder={t("to")}
                                    className={cn(field, "h-12 min-w-0")}
                                />
                            </span>
                        </fieldset>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="rq-mode" className="text-sm font-semibold">
                                {t("workMode")}
                            </label>
                            <select
                                id="rq-mode"
                                value={role.workMode}
                                onChange={(e) => setRole({ ...role, workMode: e.target.value })}
                                className={cn(field, "h-12")}
                            >
                                <option value="">{t("anyMode")}</option>
                                {WORK_MODES.map((m) => (
                                    <option key={m} value={m}>
                                        {t(`modes.${m}`)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="rq-loc" className="text-sm font-semibold">
                                {t("location")}
                            </label>
                            <input
                                id="rq-loc"
                                value={role.location}
                                maxLength={80}
                                onChange={(e) => setRole({ ...role, location: e.target.value })}
                                placeholder={t("locationPlaceholder")}
                                className={cn(field, "h-12")}
                            />
                        </div>
                        <fieldset className="flex flex-col gap-1.5">
                            <legend className="mb-1.5 text-sm font-semibold">{t("pay")}</legend>
                            <span className="flex items-center gap-2">
                                <label htmlFor="rq-pmin" className="sr-only">
                                    {t("from")}
                                </label>
                                <input
                                    id="rq-pmin"
                                    inputMode="decimal"
                                    value={role.salaryMin}
                                    onChange={(e) => setRole({ ...role, salaryMin: e.target.value.replace(/[^\d.]/g, "") })}
                                    placeholder={t("from")}
                                    className={cn(field, "h-12 min-w-0")}
                                />
                                <span aria-hidden="true">–</span>
                                <label htmlFor="rq-pmax" className="sr-only">
                                    {t("to")}
                                </label>
                                <input
                                    id="rq-pmax"
                                    inputMode="decimal"
                                    value={role.salaryMax}
                                    onChange={(e) => setRole({ ...role, salaryMax: e.target.value.replace(/[^\d.]/g, "") })}
                                    placeholder={t("to")}
                                    className={cn(field, "h-12 min-w-0")}
                                />
                            </span>
                        </fieldset>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="rq-notice" className="text-sm font-semibold">
                                {t("notice")}
                            </label>
                            <input
                                id="rq-notice"
                                inputMode="numeric"
                                value={role.maxNoticeDays}
                                onChange={(e) => setRole({ ...role, maxNoticeDays: e.target.value.replace(/\D/g, "") })}
                                className={cn(field, "h-12")}
                            />
                        </div>
                    </div>
                    <p className="rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">{t("payNote")}</p>
                </section>
            </div>

            {error && (
                <p role="alert" className="text-right text-sm font-bold text-sg-danger">
                    {error}
                </p>
            )}
            {/* Room below, so the floating Feedback button never sits on Confirm */}
            <div className="flex flex-wrap justify-end gap-2.5 pb-16">
                <button type="button" onClick={() => router.back()} className={cn(outlineButton, "h-12 px-6 text-base")}>
                    {t("back")}
                </button>
                <button type="button" onClick={confirm} disabled={isPending || ai === "loading"} className={cn(coralButton, "h-12 px-6 text-base")}>
                    {isPending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Check className="size-[18px]" aria-hidden="true" />}
                    {t("confirm")}
                </button>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, CheckCircle2, Clock, FileUp, Loader2, Lock, Pencil, Plus, Sparkles, X } from "lucide-react";
import { readMyResume, saveMyFacts } from "@/actions/resume-facts";
import { EMPTY_FACTS, pendingCount, type FactEducation, type FactRole, type FactSkill, type ResumeFacts } from "@/lib/resume-facts";
import { normalizeSkill } from "@/lib/skills";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

type Kind = "skills" | "experience" | "education";
type Item = FactSkill | FactRole | FactEducation;
const chip = "inline-flex h-[30px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold whitespace-nowrap";
const inkSmall = cn("inline-flex h-10 items-center gap-1.5 rounded-full bg-sg-ink px-4 text-sm font-bold text-sg-ink-foreground", focusRing);
const outlineSmall = cn(outlineButton, "h-10 px-4 text-sm");

/** Confirm, fix or add the facts read from a resume (AIIN-193). Only confirmed facts are ever shown or matched. */
export function FactsEditor(props: {
    confirmed: ResumeFacts;
    pending: ResumeFacts;
    noticePeriodDays: number | null;
    hasResume: boolean;
    read: boolean;
    unreadable: boolean;
}) {
    const t = useTranslations("Facts");
    const [confirmed, setConfirmed] = useState(props.confirmed);
    const [pending, setPending] = useState(props.pending);
    const [about, setAbout] = useState({
        city: props.confirmed.city ?? props.pending.city ?? "",
        totalYears: (props.confirmed.totalYears ?? props.pending.totalYears)?.toString() ?? "",
        notice: props.noticePeriodDays?.toString() ?? "",
    });
    const [reading, setReading] = useState<"idle" | "loading" | "noText" | "failed">(props.read ? "loading" : props.unreadable ? "noText" : "idle");
    const [editing, setEditing] = useState<{ kind: Kind; i: number } | null>(null);
    const [adding, setAdding] = useState<Kind | null>(null);
    const [isPending, startTransition] = useTransition();
    const started = useRef(false);

    const read = async () => {
        setReading("loading");
        const r = await readMyResume().catch(() => ({ error: "unavailable" as const }));
        if ("ok" in r) {
            setPending(r.ok.pending);
            if (r.ok.pending.city && !about.city) setAbout((a) => ({ ...a, city: r.ok.pending.city ?? "" }));
            if (r.ok.pending.totalYears !== null && !about.totalYears) setAbout((a) => ({ ...a, totalYears: String(r.ok.pending.totalYears) }));
            setReading("idle");
        } else setReading(r.error === "noText" ? "noText" : "failed");
    };
    useEffect(() => {
        if (props.read && !started.current) {
            started.current = true;
            void read();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const withAbout = (c: ResumeFacts): ResumeFacts => ({
        ...c,
        city: about.city.trim() || null,
        totalYears: about.totalYears.trim() === "" ? null : Number(about.totalYears),
    });
    const save = (c: ResumeFacts, p: ResumeFacts, message?: string) =>
        startTransition(async () => {
            const r = await saveMyFacts({ confirmed: withAbout(c), pending: { ...p, city: null, totalYears: null }, noticePeriodDays: about.notice }).catch(
                () => ({ error: "invalid" as const }),
            );
            if ("ok" in r) {
                setConfirmed(c);
                setPending(p);
                if (message) toast.success(message);
            } else toast.error(t("saveFailed"));
        });

    const list = <K extends Kind>(f: ResumeFacts, k: K) => f[k] as Item[];
    const withList = (f: ResumeFacts, k: Kind, items: Item[]): ResumeFacts => ({ ...f, [k]: items });
    const confirmOne = (k: Kind, i: number) => {
        const raw = list(pending, k)[i];
        const item = k === "skills" ? { ...(raw as FactSkill), name: normalizeSkill((raw as FactSkill).name) } : raw;
        if (!label(k, item).trim()) return;
        save(
            withList(confirmed, k, [...list(confirmed, k), item]),
            withList(
                pending,
                k,
                list(pending, k).filter((_, j) => j !== i),
            ),
        );
        setEditing(null);
    };
    const dropPending = (k: Kind, i: number) =>
        save(
            confirmed,
            withList(
                pending,
                k,
                list(pending, k).filter((_, j) => j !== i),
            ),
        );
    const dropConfirmed = (k: Kind, i: number) =>
        save(
            withList(
                confirmed,
                k,
                list(confirmed, k).filter((_, j) => j !== i),
            ),
            pending,
        );
    const edit = (k: Kind, i: number, patch: Partial<Item>) =>
        setPending(
            withList(
                pending,
                k,
                list(pending, k).map((x, j) => (j === i ? ({ ...x, ...patch } as Item) : x)),
            ),
        );
    const confirmAll = () => {
        const merged = (k: Kind) => [...list(confirmed, k), ...list(pending, k)];
        save(
            {
                ...confirmed,
                skills: merged("skills") as FactSkill[],
                experience: merged("experience") as FactRole[],
                education: merged("education") as FactEducation[],
            },
            EMPTY_FACTS,
            t("allConfirmed"),
        );
    };
    const remaining = pendingCount({ ...pending, city: null, totalYears: null });
    const total = remaining + confirmed.skills.length + confirmed.experience.length + confirmed.education.length;

    const label = (k: Kind, x: Item) =>
        k === "skills"
            ? (x as FactSkill).name
            : k === "experience"
              ? `${(x as FactRole).title}${(x as FactRole).company ? ` · ${(x as FactRole).company}` : ""}`
              : `${(x as FactEducation).degree}${(x as FactEducation).institution ? ` · ${(x as FactEducation).institution}` : ""}`;
    const sub = (k: Kind, x: Item) =>
        k === "skills"
            ? (x as FactSkill).years !== null
                ? t("years", { count: (x as FactSkill).years ?? 0 })
                : ""
            : k === "experience"
              ? [(x as FactRole).from, (x as FactRole).to].filter(Boolean).join(" – ")
              : ((x as FactEducation).year?.toString() ?? "");

    const fields = (k: Kind, x: Item, onChange: (patch: Partial<Item>) => void, idp: string) => {
        const input = (key: string, lab: string, value: string, inputMode?: "numeric" | "decimal") => (
            <span key={key} className="flex min-w-0 flex-[1_1_130px] flex-col gap-1">
                <label htmlFor={`${idp}-${key}`} className="text-[13px] font-semibold">
                    {lab}
                </label>
                <input
                    id={`${idp}-${key}`}
                    value={value}
                    inputMode={inputMode}
                    onChange={(e) => {
                        const v = e.target.value;
                        const n = v.trim() === "" ? null : Number(v);
                        onChange({ [key]: inputMode ? (Number.isFinite(n) ? n : null) : v } as Partial<Item>);
                    }}
                    className={cn(field, "h-11 min-w-0")}
                />
            </span>
        );
        if (k === "skills")
            return [input("name", t("f.skill"), (x as FactSkill).name), input("years", t("f.years"), (x as FactSkill).years?.toString() ?? "", "decimal")];
        if (k === "experience")
            return [
                input("title", t("f.title"), (x as FactRole).title),
                input("company", t("f.company"), (x as FactRole).company ?? ""),
                input("from", t("f.from"), (x as FactRole).from ?? ""),
                input("to", t("f.to"), (x as FactRole).to ?? ""),
            ];
        return [
            input("degree", t("f.degree"), (x as FactEducation).degree),
            input("institution", t("f.institution"), (x as FactEducation).institution ?? ""),
            input("year", t("f.year"), (x as FactEducation).year?.toString() ?? "", "numeric"),
        ];
    };

    const rows = (k: Kind) => (
        <ul className="flex flex-col gap-2">
            {list(confirmed, k).map((x, i) => (
                <li key={`c${i}`} className="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-sg-row px-4 py-3">
                    <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                        <strong className="break-words">{label(k, x)}</strong>
                        {sub(k, x) && <span className="text-[13px] text-sg-muted">{sub(k, x)}</span>}
                    </span>
                    <span className={cn(chip, "bg-sg-chip text-sg-success")}>
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        {t("confirmed")}
                    </span>
                    <button
                        type="button"
                        onClick={() => dropConfirmed(k, i)}
                        disabled={isPending}
                        aria-label={t("remove", { fact: label(k, x) })}
                        className={cn("inline-flex size-9 items-center justify-center rounded-full text-sg-muted hover:bg-sg-chip", focusRing)}
                    >
                        <X className="size-4" aria-hidden="true" />
                    </button>
                </li>
            ))}
            {list(pending, k).map((x, i) => {
                const open = editing?.kind === k && editing.i === i;
                return (
                    <li key={`p${i}`} className="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-sg-row px-4 py-3">
                        {open ? (
                            <span className="flex min-w-0 flex-[1_1_100%] flex-wrap gap-2.5">{fields(k, x, (patch) => edit(k, i, patch), `ed-${k}-${i}`)}</span>
                        ) : (
                            <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                                <strong className="break-words">{label(k, x)}</strong>
                                {sub(k, x) && <span className="text-[13px] text-sg-muted">{sub(k, x)}</span>}
                            </span>
                        )}
                        {!open && (
                            <span className={cn(chip, "bg-sg-lavender-soft text-sg-lavender-ink")}>
                                <Clock className="size-3.5" aria-hidden="true" />
                                {t("toCheck")}
                            </span>
                        )}
                        <span className="flex flex-wrap gap-2">
                            {!open && (
                                <button type="button" onClick={() => setEditing({ kind: k, i })} className={outlineSmall}>
                                    <Pencil className="size-4" aria-hidden="true" />
                                    {t("edit")}
                                </button>
                            )}
                            <button type="button" onClick={() => confirmOne(k, i)} disabled={isPending} className={inkSmall}>
                                <Check className="size-4" aria-hidden="true" />
                                {t("looksRight")}
                            </button>
                            <button
                                type="button"
                                onClick={() => dropPending(k, i)}
                                disabled={isPending}
                                aria-label={t("remove", { fact: label(k, x) })}
                                className={cn("inline-flex size-10 items-center justify-center rounded-full text-sg-muted hover:bg-sg-chip", focusRing)}
                            >
                                <X className="size-4" aria-hidden="true" />
                            </button>
                        </span>
                    </li>
                );
            })}
        </ul>
    );

    const blank: Record<Kind, Item> = {
        skills: { name: "", years: null },
        experience: { title: "", company: null, from: null, to: null },
        education: { degree: "", institution: null, year: null },
    };
    const [draft, setDraft] = useState<Item>(blank.skills);
    const addForm = adding && (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const k = adding;
                const item = k === "skills" ? { ...(draft as FactSkill), name: normalizeSkill((draft as FactSkill).name) } : draft;
                if (!label(k, item).trim()) return;
                save(withList(confirmed, k, [...list(confirmed, k), item]), pending, t("added"));
                setAdding(null);
            }}
            className="flex flex-col gap-3 rounded-[18px] bg-sg-row p-4"
        >
            <span className="flex flex-wrap gap-2.5">{fields(adding, draft, (patch) => setDraft({ ...draft, ...patch } as Item), "add")}</span>
            <span className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => setAdding(null)} className={outlineSmall}>
                    {t("cancel")}
                </button>
                <button type="submit" disabled={isPending} className={inkSmall}>
                    <Plus className="size-4" aria-hidden="true" />
                    {t("addIt")}
                </button>
            </span>
        </form>
    );
    const startAdd = (k: Kind) => {
        setDraft(blank[k]);
        setAdding(k);
    };

    return (
        <div className="flex flex-col gap-6">
            {reading === "loading" ? (
                <p
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink"
                >
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("reading")}
                </p>
            ) : reading === "noText" ? (
                <p role="status" className="flex items-start gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                    <FileUp className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {t("noText")}
                </p>
            ) : reading === "failed" ? (
                <p role="status" className="flex flex-wrap items-center gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                    <Sparkles className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-[1_1_220px]">{t("failed")}</span>
                    <button type="button" onClick={read} className={cn("font-bold underline", focusRing)}>
                        {t("tryAgain")}
                    </button>
                </p>
            ) : !props.hasResume ? (
                <p className="flex flex-wrap items-center gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                    <FileUp className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-[1_1_220px]">{t("noResume")}</span>
                </p>
            ) : (
                <p className="flex items-start gap-2.5 rounded-[16px] bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">
                    <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    {t("progress", { done: total - remaining, total })}
                </p>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-2">
                <section aria-labelledby="fx-work" className={cn(panel, "gap-3 sm:p-7")}>
                    <h2 id="fx-work" className={panelTitle}>
                        {t("experience")}
                    </h2>
                    {rows("experience")}
                    {list(confirmed, "experience").length + list(pending, "experience").length === 0 && <p className="text-sm text-sg-muted">{t("none")}</p>}
                    <h2 className={cn(panelTitle, "mt-2")}>{t("education")}</h2>
                    {rows("education")}
                    {list(confirmed, "education").length + list(pending, "education").length === 0 && <p className="text-sm text-sg-muted">{t("none")}</p>}
                </section>
                <div className="flex flex-col gap-6">
                    <section aria-labelledby="fx-skills" className={cn(panel, "gap-3 sm:p-7")}>
                        <h2 id="fx-skills" className={panelTitle}>
                            {t("skills")}
                        </h2>
                        {rows("skills")}
                        {list(confirmed, "skills").length + list(pending, "skills").length === 0 && <p className="text-sm text-sg-muted">{t("none")}</p>}
                    </section>
                    <section aria-labelledby="fx-about" className={cn(panel, "gap-3 sm:p-7")}>
                        <h2 id="fx-about" className={panelTitle}>
                            {t("about")}
                        </h2>
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
                            {(
                                [
                                    ["city", t("city"), undefined],
                                    ["totalYears", t("totalYears"), "decimal"],
                                    ["notice", t("notice"), "numeric"],
                                ] as const
                            ).map(([key, lab, mode]) => (
                                <span key={key} className="flex flex-col gap-1.5">
                                    <label htmlFor={`fx-${key}`} className="text-sm font-semibold">
                                        {lab}
                                    </label>
                                    <input
                                        id={`fx-${key}`}
                                        inputMode={mode}
                                        value={about[key]}
                                        onChange={(e) => setAbout({ ...about, [key]: e.target.value })}
                                        className={cn(field, "h-12 min-w-0")}
                                    />
                                </span>
                            ))}
                        </div>
                    </section>
                    <section aria-labelledby="fx-missing" className={cn(panel, "gap-3 sm:p-7")}>
                        <h2 id="fx-missing" className={panelTitle}>
                            {t("missing")}
                        </h2>
                        {addForm || (
                            <span className="flex flex-wrap gap-2">
                                {(["skills", "experience", "education"] as const).map((k) => (
                                    <button key={k} type="button" onClick={() => startAdd(k)} className={outlineSmall}>
                                        <Plus className="size-4" aria-hidden="true" />
                                        {t(`add.${k}`)}
                                    </button>
                                ))}
                                <Link href="/candidate/onboarding?from=profile" className={outlineSmall}>
                                    <FileUp className="size-4" aria-hidden="true" />
                                    {t("newResume")}
                                </Link>
                            </span>
                        )}
                    </section>
                </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2.5 pb-16">
                <button type="button" onClick={confirmAll} disabled={isPending || reading === "loading"} className={cn(coralButton, "h-12 px-6 text-base")}>
                    {isPending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Check className="size-[18px]" aria-hidden="true" />}
                    {remaining ? t("confirmAll", { count: remaining }) : t("save")}
                </button>
            </div>
        </div>
    );
}

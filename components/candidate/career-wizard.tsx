"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BarChart3, CircleCheck, Code, FileText, Loader2, Plus, Settings, Upload, X } from "lucide-react";
import { updateCandidateProfile, updateProfile } from "@/actions/profile";
import { CAREER_ROLES, GOAL_LIMIT, ROLE_NAMES, SKILL_LENGTH, SKILL_LIMIT, SUGGESTED_SKILLS, type CareerRole } from "@/lib/career-path";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { outlineButton } from "@/components/interview/session-shell";
import { cn } from "@/lib/utils";

const STEPS = ["role", "skills", "resume", "goal"] as const;
const ROLE_ICONS = { sde: Code, qa: CircleCheck, data: BarChart3, devops: Settings } satisfies Record<CareerRole, unknown>;

const label = "text-[13px] font-bold leading-[18px] text-sg-muted";
const field = "w-full rounded-2xl border border-sg-field-border bg-sg-row px-4 text-base placeholder:text-sg-muted/70";

interface CareerWizardProps {
    role: CareerRole | null;
    skills: string[];
    goal: string;
    resumeName: string | null;
    /** Where Finish (and Finish later) lead. */
    doneHref: string;
}

/** The four-step career path set-up, shown to new candidates after they register (AIIN-52). */
export function CareerWizard({ role: initialRole, skills: initialSkills, goal: initialGoal, resumeName: initialResume, doneHref }: CareerWizardProps) {
    const t = useTranslations("Onboarding");
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [role, setRole] = useState<CareerRole | null>(initialRole);
    const [skills, setSkills] = useState(initialSkills);
    const [skillInput, setSkillInput] = useState("");
    const [goal, setGoal] = useState(initialGoal);
    const [resume, setResume] = useState(initialResume);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const heading = useRef<HTMLHeadingElement>(null);
    const radios = useRef<(HTMLButtonElement | null)[]>([]);
    const fileInput = useRef<HTMLInputElement>(null);
    const moved = useRef(false);

    const name = STEPS[step];
    const last = step === STEPS.length - 1;
    const canContinue = name === "role" ? !!role : name === "skills" ? skills.length > 0 : true;

    // A new step is a new screen: take keyboard and screen reader focus to its title.
    useEffect(() => {
        if (moved.current) heading.current?.focus();
    }, [step]);

    const go = (to: number) => {
        moved.current = true;
        setError(null);
        setStep(to);
    };

    const addSkill = (raw: string) => {
        const skill = raw.trim().slice(0, SKILL_LENGTH);
        if (skill && skills.length < SKILL_LIMIT && !skills.some((s) => s.toLowerCase() === skill.toLowerCase())) setSkills([...skills, skill]);
    };

    const onRoleKey = (e: React.KeyboardEvent, index: number) => {
        const delta = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!delta) return;
        e.preventDefault();
        const next = (index + delta + CAREER_ROLES.length) % CAREER_ROLES.length;
        setRole(CAREER_ROLES[next]);
        radios.current[next]?.focus();
    };

    const upload = async (file: File) => {
        setUploading(true);
        setError(null);
        try {
            const body = new FormData();
            body.append("file", file);
            body.append("type", "resume");
            const res = await fetch("/api/upload/profile", { method: "POST", body });
            if (!res.ok) throw new Error("upload");
            const { url, name: fileName } = (await res.json()) as { url: string; name: string };
            const saved = await updateProfile({ resumeUrl: url, resumeName: fileName });
            if (saved.error) throw new Error("save");
            setResume(fileName);
        } catch {
            setError(t("uploadFailed"));
        } finally {
            setUploading(false);
        }
    };

    // Each step is saved as you go, so "Finish later" keeps what you've told U.
    const next = () =>
        startTransition(async () => {
            const result = await updateCandidateProfile({
                primaryRole: role ? ROLE_NAMES[role] : undefined,
                skills,
                careerGoals: goal.trim(),
                ...(last ? { onboardingComplete: true } : {}),
            });
            if (result.error) {
                setError(t("saveFailed"));
                return;
            }
            if (last) router.push(doneHref);
            else go(step + 1);
        });

    const suggestions = (role ? SUGGESTED_SKILLS[role] : SUGGESTED_SKILLS.sde).filter((s) => !skills.some((k) => k.toLowerCase() === s.toLowerCase()));

    return (
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-5">
            <ol aria-label={t("steps")} className="flex flex-wrap gap-x-5 gap-y-2">
                {STEPS.map((s, i) => (
                    <li key={s} aria-current={i === step ? "step" : undefined} className="flex items-center gap-2">
                        <span
                            aria-hidden="true"
                            className={cn(
                                "inline-flex size-7 items-center justify-center rounded-full text-[13px] font-bold",
                                i < step ? "bg-sg-lavender-soft text-sg-lavender-ink" : i === step ? "bg-sg-ink text-sg-ink-foreground" : "bg-sg-chip text-sg-muted"
                            )}
                        >
                            {i + 1}
                        </span>
                        <span className={cn("sr-only text-sm font-semibold sm:not-sr-only", i === step ? "text-sg-text" : "text-sg-muted")}>{t(`stepNames.${s}`)}</span>
                    </li>
                ))}
            </ol>

            <section aria-labelledby="ob-title" className="sg-glass sg-shadow-lg flex flex-col gap-5 rounded-[24px] p-[22px] sm:rounded-[32px] sm:p-9">
                <div className="flex flex-col gap-2">
                    <span className={label}>{t("stepOf", { step: step + 1, total: STEPS.length })}</span>
                    <h1 id="ob-title" ref={heading} tabIndex={-1} className="font-display sg-soft text-[28px] font-semibold leading-[1.18] tracking-[-0.02em] outline-none sm:text-[34px]">
                        {t(`titles.${name}`)}
                    </h1>
                    <p className="text-sg-muted">{t(`descs.${name}`)}</p>
                </div>

                {name === "role" && (
                    <div role="radiogroup" aria-label={t("roleGroup")} className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-2.5">
                        {CAREER_ROLES.map((r, i) => {
                            const Icon = ROLE_ICONS[r];
                            const on = role === r;
                            return (
                                <button
                                    key={r}
                                    ref={(el) => {
                                        radios.current[i] = el;
                                    }}
                                    type="button"
                                    role="radio"
                                    aria-checked={on}
                                    tabIndex={on || (!role && i === 0) ? 0 : -1}
                                    onClick={() => setRole(r)}
                                    onKeyDown={(e) => onRoleKey(e, i)}
                                    className={cn(
                                        "flex min-h-[76px] w-full items-center gap-3.5 rounded-[20px] p-3.5 text-left",
                                        on ? "border-2 border-sg-ink bg-sg-glass-strong shadow-[var(--sg-shadow)]" : "border border-sg-field-border bg-sg-row hover:bg-sg-chip",
                                        focusRing
                                    )}
                                >
                                    <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sg-chip">
                                        <Icon className="size-5" />
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <span className="font-bold">{t(`roles.${r}.name`)}</span>
                                        <span className="text-sm text-sg-muted">{t(`roles.${r}.desc`)}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {name === "skills" && (
                    <>
                        <div className="flex flex-col gap-2">
                            <span className={label}>{t("yourSkills")}</span>
                            {skills.length > 0 ? (
                                <ul className="flex flex-wrap gap-2">
                                    {skills.map((s) => (
                                        <li key={s} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sg-ink pr-1.5 pl-3.5 text-sm font-semibold text-sg-ink-foreground">
                                            {s}
                                            <button
                                                type="button"
                                                aria-label={t("removeSkill", { skill: s })}
                                                onClick={() => setSkills(skills.filter((k) => k !== s))}
                                                className={cn("inline-flex size-7 items-center justify-center rounded-full hover:bg-white/15", focusRing)}
                                            >
                                                <X className="size-4" aria-hidden="true" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[15px] text-sg-muted">{t("noSkills")}</p>
                            )}
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                addSkill(skillInput);
                                setSkillInput("");
                            }}
                            className="flex gap-2"
                        >
                            <label htmlFor="ob-skill" className="sr-only">
                                {t("addSkill")}
                            </label>
                            <input
                                id="ob-skill"
                                value={skillInput}
                                maxLength={SKILL_LENGTH}
                                onChange={(e) => setSkillInput(e.target.value)}
                                placeholder={t("addSkillPlaceholder")}
                                className={cn(field, "h-12 min-w-0", focusRing)}
                            />
                            <button type="submit" disabled={!skillInput.trim()} className={cn(outlineButton, "h-12 shrink-0 px-5 text-base")}>
                                {t("add")}
                            </button>
                        </form>
                        {suggestions.length > 0 && (
                            <div className="flex flex-col gap-2">
                                <span className={label}>{role ? t("popular", { role: t(`roles.${role}.name`) }) : t("popularAny")}</span>
                                <ul className="flex flex-wrap gap-2">
                                    {suggestions.map((s) => (
                                        <li key={s}>
                                            <button
                                                type="button"
                                                aria-label={t("addSuggested", { skill: s })}
                                                onClick={() => addSkill(s)}
                                                className={cn("inline-flex h-9 items-center gap-1.5 rounded-full bg-sg-chip px-3 text-sm font-semibold hover:bg-sg-row", focusRing)}
                                            >
                                                <Plus className="size-4" aria-hidden="true" />
                                                {s}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}

                {name === "resume" && (
                    <>
                        <div className="flex flex-wrap items-center gap-3 rounded-[18px] bg-sg-row px-4 py-3.5">
                            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-sg-lavender-soft text-sg-lavender-ink">
                                <FileText className="size-5" />
                            </span>
                            <div className="flex min-w-0 flex-[1_1_160px] flex-col">
                                <span className="font-bold [overflow-wrap:anywhere]">{resume ?? t("resumeNone")}</span>
                                {resume && <span className={cn(label, "font-medium")}>{t("resumeAdded")}</span>}
                            </div>
                            <input
                                ref={fileInput}
                                type="file"
                                accept=".pdf,application/pdf"
                                className="sr-only"
                                tabIndex={-1}
                                aria-hidden="true"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = "";
                                    if (file) void upload(file);
                                }}
                            />
                            <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className={outlineButton}>
                                {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                                {uploading ? t("uploading") : resume ? t("replace") : t("upload")}
                            </button>
                        </div>
                        <p className="text-[15px] text-sg-muted">{t("resumeHint")}</p>
                    </>
                )}

                {name === "goal" && (
                    <>
                        <label htmlFor="ob-goal" className="sr-only">
                            {t("goalLabel")}
                        </label>
                        <textarea
                            id="ob-goal"
                            rows={4}
                            value={goal}
                            maxLength={GOAL_LIMIT}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder={t("goalPlaceholder")}
                            className={cn(field, "min-h-[140px] resize-y py-3", focusRing)}
                        />
                    </>
                )}

                {error && (
                    <p role="alert" className="text-[15px] font-semibold text-sg-danger">
                        {error}
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    {step > 0 ? (
                        <button type="button" onClick={() => go(step - 1)} className={cn(outlineButton, "h-12 px-5 text-base")}>
                            {t("back")}
                        </button>
                    ) : (
                        <span />
                    )}
                    <button type="button" onClick={next} disabled={!canContinue || isPending || uploading} className={cn(coralButton, "h-[52px] px-7 text-base")}>
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {isPending ? t("saving") : last ? t("finish") : t("continue")}
                    </button>
                </div>
            </section>
        </div>
    );
}

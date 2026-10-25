"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Loader2, Mic } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createMockInterview, checkApiStatus } from "@/actions/mock-interview";
import { CoachBubble } from "@/components/soft-glass/coach-bubble";
import { coralButton, fieldInput, focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

export interface RecentPractice {
    id: string;
    role: string;
    difficulty: string;
    score: number | null;
    /** Already formatted, e.g. "23 Oct". */
    date: string;
}

interface PracticeViewProps {
    /** Monthly practice allowance; null when unlimited. */
    allowance: { remaining: number; limit: number } | null;
    recent: RecentPractice[];
    initialRole?: string;
    initialLevel?: string;
}

const ROLE_KEYS = ["frontend", "software", "data", "pm", "hr"] as const;
const LEVELS = ["Junior", "Mid", "Senior"] as const;

export function PracticeView({ allowance, recent, initialRole = "", initialLevel = "Junior" }: PracticeViewProps) {
    const t = useTranslations("PracticeInterviews");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [role, setRole] = useState(initialRole);
    const [difficulty, setDifficulty] = useState(initialLevel);
    const [apiStatus, setApiStatus] = useState<{ available: boolean; usingFallback?: boolean; reason?: string } | null>(null);
    const [isCheckingApi, setIsCheckingApi] = useState(true);

    // Check API status on mount
    useEffect(() => {
        const checkApi = async () => {
            const status = await checkApiStatus();
            setApiStatus(status);
            setIsCheckingApi(false);
        };
        checkApi();
    }, []);

    const handleStart = () => {
        if (!role.trim()) {
            toast.error(t("toast.enterRole"));
            return;
        }

        startTransition(async () => {
            const result = await createMockInterview(role, difficulty);
            if (result.success && result.mockInterviewId) {
                toast.success(t("toast.created"));
                router.push(`/candidate/practice/${result.mockInterviewId}`);
            } else {
                toast.error(result.error || t("limitedAvailability.fallback"));
            }
        });
    };

    const isDisabled = !apiStatus?.available || isPending;
    const levelLabel = t(`setup.levels.${difficulty as (typeof LEVELS)[number]}`);
    const cardHeading = "font-display sg-soft text-[22px] font-semibold leading-7";

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex max-w-[640px] flex-col gap-2">
                    <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                        {t("setup.title")}
                    </h1>
                    <p className="text-lg text-sg-muted">{t("setup.description")}</p>
                </div>
                {allowance && (
                    <span className="sg-glass inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-1.5 font-semibold">
                        {allowance.limit <= 10 && (
                            <span aria-hidden="true" className="inline-flex gap-[3px]">
                                {Array.from({ length: allowance.limit }, (_, i) => (
                                    <span
                                        key={i}
                                        className={cn(
                                            "size-2.5 rounded-full",
                                            i < allowance.remaining ? "bg-sg-coral" : "border-2 border-sg-muted"
                                        )}
                                    />
                                ))}
                            </span>
                        )}
                        {t("setup.allowance", { remaining: allowance.remaining, limit: allowance.limit })}
                    </span>
                )}
            </div>

            <div className="flex flex-wrap items-start gap-6">
                <section
                    aria-label={t("setup.sectionLabel")}
                    className="sg-glass sg-shadow-lg flex min-w-0 flex-[999_1_560px] flex-col gap-7 rounded-[24px] p-5 sm:rounded-[28px] sm:p-8"
                >
                    {apiStatus?.usingFallback && (
                        <div role="status" className="flex items-start gap-3 rounded-[18px] bg-sg-row p-4">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                            <div className="flex flex-col gap-1">
                                <span className="font-bold">{t("limitedAvailability.title")}</span>
                                <span className="text-sg-muted">{apiStatus.reason || t("limitedAvailability.fallback")}</span>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <label htmlFor="practice-role" className={cardHeading}>
                            {t("setup.roleLabel")}
                        </label>
                        <Input
                            id="practice-role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder={t("setup.rolePlaceholder")}
                            disabled={isPending}
                            className={fieldInput}
                        />
                        <div role="group" aria-label={t("setup.popularRoles")} className="flex flex-wrap gap-2">
                            {ROLE_KEYS.map((key) => {
                                const label = t(`setup.roles.${key}`);
                                const pressed = role === label;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-pressed={pressed}
                                        onClick={() => setRole(label)}
                                        disabled={isPending}
                                        className={cn(
                                            "h-10 rounded-full border-2 px-4 text-sm font-semibold transition-colors",
                                            pressed
                                                ? "border-sg-ink bg-sg-ink text-sg-ink-foreground"
                                                : "border-sg-glass-border bg-sg-row text-sg-text hover:bg-sg-chip",
                                            focusRing
                                        )}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span id="practice-level-label" className={cardHeading}>
                            {t("setup.levelLabel")}
                        </span>
                        <div
                            role="radiogroup"
                            aria-labelledby="practice-level-label"
                            className="grid grid-cols-3 gap-1.5 rounded-[18px] bg-sg-chip p-1.5"
                        >
                            {LEVELS.map((level) => {
                                const checked = difficulty === level;
                                return (
                                    <button
                                        key={level}
                                        type="button"
                                        role="radio"
                                        aria-checked={checked}
                                        onClick={() => setDifficulty(level)}
                                        disabled={isPending}
                                        className={cn(
                                            "min-h-16 min-w-0 rounded-[14px] px-3 py-2.5 text-left text-[15px] leading-[22px] transition-colors",
                                            checked
                                                ? "bg-[var(--sg-glass-strong)] text-sg-text shadow-[var(--sg-shadow)]"
                                                : "text-sg-muted hover:text-sg-text",
                                            focusRing
                                        )}
                                    >
                                        <span className="block font-bold">{t(`setup.levels.${level}`)}</span>
                                        <span className="block text-[13px] font-medium leading-[18px]">
                                            {t(`setup.levels.${level}Note`)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                        <button
                            type="button"
                            onClick={handleStart}
                            disabled={isDisabled}
                            className={cn(coralButton, "h-14 w-full px-7 text-[17px] sm:w-auto")}
                        >
                            {isPending || isCheckingApi ? (
                                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                            ) : (
                                <Mic className="size-5" aria-hidden="true" />
                            )}
                            {isPending ? t("setup.starting") : isCheckingApi ? t("setup.checking") : t("setup.start")}
                        </button>
                        <span className="text-sg-muted">
                            {role.trim()
                                ? t("setup.estimate", { role: role.trim(), level: levelLabel.toLowerCase() })
                                : t("setup.estimateNoRole")}
                        </span>
                    </div>
                </section>

                <aside
                    aria-label={t("setup.recentLabel")}
                    className="flex min-w-[min(260px,100%)] max-w-full flex-[1_1_300px] flex-col gap-4 lg:max-w-[400px]"
                >
                    <CoachBubble>
                        <span className="text-sg-muted">{t("setup.coach")}</span>
                    </CoachBubble>
                    <div className="sg-glass flex flex-col gap-3 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7">
                        <h2 className={cardHeading}>{t("setup.recentTitle")}</h2>
                        {recent.length === 0 ? (
                            <p className="text-sg-muted">{t("setup.recentEmpty")}</p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {recent.map((item) => (
                                    <li key={item.id}>
                                        <Link
                                            // Same rule as the session page: a scored practice is finished.
                                            href={item.score ? `/candidate/practice/${item.id}/result` : `/candidate/practice/${item.id}`}
                                            className={cn(
                                                "flex items-center gap-3 rounded-2xl bg-sg-row p-3 transition-colors hover:bg-sg-chip",
                                                focusRing
                                            )}
                                        >
                                            <span className="flex min-w-0 flex-1 flex-col">
                                                <span className="truncate font-semibold">{item.role}</span>
                                                <span className="text-[13px] font-medium leading-[18px] text-sg-muted">
                                                    {item.date} · {item.difficulty}
                                                </span>
                                            </span>
                                            {item.score ? (
                                                <span className="inline-flex h-[30px] min-w-12 items-center justify-center rounded-full bg-sg-lavender-soft px-2.5 text-sm font-bold text-sg-lavender-ink">
                                                    {item.score.toFixed(1)}
                                                    <span className="sr-only"> {t("setup.outOfTen")}</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex h-[30px] items-center rounded-full bg-sg-chip px-2.5 text-[13px] font-bold">
                                                    {t("setup.inProgress")}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, Camera, Check, Loader2, LogOut, Minimize, Monitor, X, type LucideIcon } from "lucide-react";
import { acceptConsent, declineConsent } from "@/actions/consent";
import { CHECKS, NOTICE, NOTICE_LANGUAGES, noticeLanguage, sentence, type Check as CheckKey } from "@/lib/integrity/notice";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";
import { FocusRoot, eyebrow, inkButton } from "./session-shell";

const ICONS: Record<CheckKey, LucideIcon> = { focus: LogOut, fullscreen: Minimize, copyPaste: Ban, screens: Monitor, camera: Camera };

// The two choices are equally prominent: agreeing mustn't be the easier button (AIIN-176)
const choice = cn(
    "inline-flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-sg-ink bg-(--sg-glass-strong) px-4 text-[17px] font-bold text-sg-text transition-colors hover:bg-sg-chip disabled:pointer-events-none disabled:opacity-60",
    focusRing
);
const heading = "font-display sg-soft text-[22px] font-semibold leading-7";

interface ConsentNoticeProps {
    interviewId: string;
    jobTitle: string;
    /** The employer's name, or null to say "the employer". */
    company: string | null;
    /** When the link expires, already formatted, or null. */
    expires: string | null;
    /** The interview's language: the notice starts in it. */
    language: string;
    onAgreed: () => void;
}

/** What the interview checks, why, what's kept and who sees it, before anything starts (AIIN-176). */
export function ConsentNotice({ interviewId, jobTitle, company, expires, language, onAgreed }: ConsentNoticeProps) {
    const [lang, setLang] = useState(noticeLanguage(language));
    const [declined, setDeclined] = useState(false);
    const [busy, setBusy] = useState<"agree" | "decline" | null>(null);
    const c = NOTICE[lang];
    const employer = company ?? c.theEmployer;

    const agree = async () => {
        setBusy("agree");
        const result = await acceptConsent(interviewId, lang).catch(() => ({ ok: false }));
        setBusy(null);
        if (result.ok) onAgreed();
        else toast.error(c.failed);
    };

    const decline = async () => {
        setBusy("decline");
        const result = await declineConsent(interviewId).catch(() => ({ ok: false }));
        setBusy(null);
        if (result.ok) setDeclined(true);
        else toast.error(c.failed);
    };

    return (
        <FocusRoot>
            <header className="sg-glass flex flex-wrap items-center justify-between gap-3 rounded-[22px] py-2.5 pl-4 pr-3">
                <span className="flex items-center gap-2.5">
                    <UMark />
                    <span className="whitespace-nowrap text-lg font-semibold">Get Back To U</span>
                </span>
                <span className="flex items-center gap-2">
                    <label htmlFor="cs-lang" className="sr-only">
                        {c.language}
                    </label>
                    <select
                        id="cs-lang"
                        value={lang}
                        onChange={(e) => setLang(noticeLanguage(e.target.value))}
                        className={cn("h-10 rounded-full border border-sg-field-border bg-sg-row px-3 text-sm font-semibold", focusRing)}
                    >
                        {NOTICE_LANGUAGES.map((l) => (
                            <option key={l} value={l}>
                                {NOTICE[l].label}
                            </option>
                        ))}
                    </select>
                    <ThemeSwitch />
                </span>
            </header>

            <main lang={lang} className="flex justify-center">
                {!declined ? (
                    <section
                        aria-labelledby="cs-title"
                        className="sg-glass sg-shadow-lg flex w-full max-w-[720px] flex-col gap-5 rounded-[24px] p-5 sm:rounded-[32px] sm:p-9"
                    >
                        <div className="flex flex-col gap-2">
                            <span className={eyebrow}>{company ? `${jobTitle} · ${company}` : jobTitle}</span>
                            <h1 id="cs-title" className="font-display sg-soft text-balance text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] sm:text-[44px]">
                                {c.title}
                            </h1>
                            <p className="text-lg leading-7 text-sg-muted">{c.lead}</p>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <h2 className={heading}>{c.checkH}</h2>
                            <ul className="flex flex-col gap-2">
                                {CHECKS.map((check) => {
                                    const Icon = ICONS[check];
                                    return (
                                        <li key={check} className="flex items-start gap-3 rounded-2xl bg-sg-row px-3.5 py-3">
                                            <Icon className="mt-0.5 size-5 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                                            <span>{c.checks[check]}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <h2 className={heading}>{c.whyH}</h2>
                            <p>{sentence(c.why(employer))}</p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <h2 className={heading}>{c.keepH}</h2>
                            <ul className="flex list-disc flex-col gap-1.5 pl-5">
                                {c.keep.map((k) => (
                                    <li key={k}>{k}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <h2 className={heading}>{c.whoH}</h2>
                            <p>{c.who}</p>
                        </div>

                        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-2.5 pt-1">
                            <button type="button" onClick={agree} disabled={busy !== null} className={choice}>
                                {busy === "agree" ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Check className="size-5" aria-hidden="true" />}
                                {c.agree}
                            </button>
                            <button type="button" onClick={decline} disabled={busy !== null} className={choice}>
                                {busy === "decline" ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <X className="size-5" aria-hidden="true" />}
                                {c.disagree}
                            </button>
                        </div>
                        <p className="text-[15px] leading-[23px] text-sg-muted">{sentence(c.means(employer))}</p>
                    </section>
                ) : (
                    <section role="status" className="sg-glass sg-shadow-lg flex w-full max-w-[560px] flex-col items-center gap-3.5 rounded-[32px] p-6 text-center sm:p-9">
                        <span className="flex size-12 items-center justify-center rounded-full bg-sg-lavender-soft text-sg-lavender-ink">
                            <X className="size-6" aria-hidden="true" />
                        </span>
                        <h1 className="font-display sg-soft text-balance text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] sm:text-[44px]">
                            {c.declinedTitle}
                        </h1>
                        <p className="text-lg leading-7 text-sg-muted">{sentence(c.declined(employer, expires))}</p>
                        <div className="flex flex-wrap justify-center gap-2.5">
                            <button type="button" onClick={() => setDeclined(false)} className={cn("sg-glass h-12 rounded-full px-5 font-bold", focusRing)}>
                                {c.again}
                            </button>
                            <Link href="/candidate/dashboard" className={cn(inkButton, "h-12 px-5")}>
                                {c.dashboard}
                            </Link>
                        </div>
                    </section>
                )}
            </main>
        </FocusRoot>
    );
}

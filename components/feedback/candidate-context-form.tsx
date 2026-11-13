"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { sendCandidateContext } from "@/actions/candidate-context";
import { inkButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

const MAX = 500;

/** "Add your side": sent once, then shown as sent (AIIN-185). */
export function CandidateContextForm({ interviewId, company, sent }: { interviewId: string; company: string; sent: { text: string; on: string } | null }) {
    const t = useTranslations("CandidateFlags");
    const router = useRouter();
    const [text, setText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    if (sent)
        return (
            <div role="status" className="flex flex-col gap-2.5">
                <span className="inline-flex items-center gap-2 font-bold">
                    <CheckCircle2 className="size-[18px] text-sg-success" aria-hidden="true" />
                    {t("sentOn", { date: sent.on })}
                </span>
                <p className="text-sg-muted">{t("sentBody", { company })}</p>
                <blockquote className="rounded-2xl bg-sg-row px-3.5 py-3 whitespace-pre-line [overflow-wrap:anywhere]">“{sent.text}”</blockquote>
            </div>
        );

    const send = () =>
        startTransition(async () => {
            setError(null);
            if (!text.trim()) return setError(t("empty"));
            const r = await sendCandidateContext(interviewId, text).catch(() => ({ error: "failed" as const }));
            if ("ok" in r || r.error === "sent") router.refresh();
            else setError(t(r.error === "invalid" ? "tooLong" : "failed"));
        });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                send();
            }}
            className="flex flex-col gap-4"
        >
            <label htmlFor="cf-note" className="text-sm font-semibold">
                {t("label")} <span className="font-medium text-sg-muted">{t("optional")}</span>
            </label>
            <textarea
                id="cf-note"
                rows={5}
                value={text}
                maxLength={MAX}
                onChange={(e) => setText(e.target.value)}
                aria-describedby={error ? "cf-hint cf-error" : "cf-hint"}
                aria-invalid={!!error}
                placeholder={t("placeholder")}
                className="w-full resize-y rounded-2xl border border-sg-field-border bg-sg-row px-4 py-3 text-base leading-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sg-focus)]"
            />
            <span id="cf-hint" className="text-[13px] text-sg-muted">
                {t("hint", { company, left: MAX - text.length })}
            </span>
            {error && (
                <p id="cf-error" role="alert" className="text-sm font-bold text-sg-danger">
                    {error}
                </p>
            )}
            <button type="submit" disabled={isPending} className={cn(inkButton, "h-12 self-start px-[22px] text-base")}>
                {isPending ? <Loader2 className="size-[18px] animate-spin" aria-hidden="true" /> : <Send className="size-[18px]" aria-hidden="true" />}
                {t("send", { company })}
            </button>
        </form>
    );
}

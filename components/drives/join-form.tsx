"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2 } from "lucide-react";
import { joinDrive } from "@/actions/drive-join";
import { coralButton } from "@/components/soft-glass/classes";
import { field, fieldLabel } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Pick your college and join (AIIN-168), from the approved "Join the drive" artboards. Or continue, if already in. */
export function JoinForm({ slug, colleges, cont }: { slug: string; colleges: { id: string; name: string; city: string | null }[]; cont: boolean }) {
    const t = useTranslations("DriveJoin");
    const router = useRouter();
    const [collegeId, setCollegeId] = useState(colleges.length === 1 ? colleges[0].id : "");
    const [roll, setRoll] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isPending, start] = useTransition();
    const go = () =>
        start(async () => {
            setError(null);
            if (!cont && colleges.length && !collegeId) return setError(t("chooseCollege"));
            const r = await joinDrive(slug, { collegeId: collegeId || null, roll }).catch(() => ({ error: "failed" as const }));
            if ("ok" in r) router.push(r.next);
            else setError(r.error === "limited" ? t("limited") : t("failed"));
        });
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                go();
            }}
            className="flex flex-col gap-4"
        >
            {!cont && colleges.length > 0 && (
                <fieldset className="flex flex-col gap-2.5">
                    <legend className="sr-only">{t("college")}</legend>
                    {colleges.map((c) => (
                        <label
                            key={c.id}
                            className={cn(
                                "flex min-h-14 cursor-pointer items-center gap-3 rounded-[18px] border-2 bg-sg-row px-4 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sg-focus",
                                collegeId === c.id ? "border-sg-ink" : "border-transparent",
                            )}
                        >
                            <input type="radio" name="college" checked={collegeId === c.id} onChange={() => setCollegeId(c.id)} className="size-5 shrink-0 accent-[var(--sg-ink)]" />
                            <span className="flex min-w-0 flex-col">
                                <strong className="break-words">{c.name}</strong>
                                {c.city && <span className="text-sm text-sg-muted">{c.city}</span>}
                            </span>
                        </label>
                    ))}
                </fieldset>
            )}
            {!cont && (
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="dj-roll" className={fieldLabel}>
                        {t("roll")}
                    </label>
                    <input id="dj-roll" value={roll} maxLength={40} onChange={(e) => setRoll(e.target.value)} aria-describedby="dj-roll-h" className={cn(field, "h-12")} />
                    <span id="dj-roll-h" className="text-[13px] text-sg-muted">
                        {t("rollHint")}
                    </span>
                </div>
            )}
            {error && (
                <p role="alert" className="text-sm font-semibold text-sg-danger">
                    {error}
                </p>
            )}
            <button type="submit" disabled={isPending} className={cn(coralButton, "h-12 px-6 text-base")}>
                {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
                {t("continue")}
            </button>
        </form>
    );
}

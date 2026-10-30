import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mail, MailX } from "lucide-react";
import { db } from "@/lib/db";
import { verifyUnsubscribe } from "@/lib/weekly-report/unsubscribe-token";
import { setWeeklyEmailsFromLink } from "@/actions/weekly-report";
import { FocusRoot } from "@/components/interview/session-shell";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { focusRing } from "@/components/soft-glass/classes";
import { glassButton, inkButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/**
 * The weekly report's "Stop weekly emails" link (AIIN-103). Opening it stops them straight away; the page can
 * turn them back on. The signed link is the only key, so no sign-in is needed.
 */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ u?: string; t?: string; state?: string }> }) {
    const t = await getTranslations("Unsubscribe");
    const { u, t: token, state } = await searchParams;
    const valid = verifyUnsubscribe(u, token);

    let user: { email: string; weeklyReportEmails: boolean } | null = null;
    if (valid) {
        if (state !== "on") await db.user.updateMany({ where: { id: u }, data: { weeklyReportEmails: false } });
        user = await db.user.findUnique({ where: { id: u }, select: { email: true, weeklyReportEmails: true } });
    }
    const on = !!user?.weeklyReportEmails;
    const Icon = on ? Mail : MailX;

    return (
        <FocusRoot>
            <header className="sg-bar flex items-center justify-between gap-3 rounded-[28px] py-2 pr-2 pl-3.5">
                <Link href="/" aria-label={t("home")} className={cn("flex items-center gap-2.5 rounded-full", focusRing)}>
                    <UMark className="size-[30px]" />
                    <span className="font-display sg-soft text-lg font-semibold whitespace-nowrap">{t("brand")}</span>
                </Link>
                <ThemeSwitch />
            </header>
            <main className="flex justify-center pt-4 sm:pt-16">
                <section role="status" aria-labelledby="un-title" className="sg-glass sg-shadow-lg flex w-full max-w-[520px] flex-col items-center gap-3.5 rounded-[32px] p-6 text-center sm:p-9">
                    <span aria-hidden="true" className="inline-flex size-14 items-center justify-center rounded-[18px] bg-sg-chip">
                        <Icon className="size-[26px]" />
                    </span>
                    {user ? (
                        <>
                            <h1 id="un-title" className="font-display sg-soft text-[28px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[36px]">
                                {on ? t("onTitle") : t("offTitle")}
                            </h1>
                            <p className="text-[17px] leading-[26px] text-sg-muted">{on ? t("onBody") : t("offBody", { email: user.email })}</p>
                            <div className="mt-1 flex flex-wrap justify-center gap-2.5">
                                <form action={setWeeklyEmailsFromLink}>
                                    <input type="hidden" name="u" value={u} />
                                    <input type="hidden" name="t" value={token} />
                                    <input type="hidden" name="on" value={on ? "0" : "1"} />
                                    <button type="submit" className={cn(glassButton, "h-12 px-[22px]")}>
                                        {on ? t("stopAgain") : t("turnOn")}
                                    </button>
                                </form>
                                <Link href="/candidate/dashboard" className={cn(inkButton, "h-12 px-[22px]")}>
                                    {t("today")}
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 id="un-title" className="font-display sg-soft text-[28px] font-semibold leading-[1.14] tracking-[-0.025em] sm:text-[36px]">
                                {t("invalidTitle")}
                            </h1>
                            <p className="text-[17px] leading-[26px] text-sg-muted">{t("invalidBody")}</p>
                            <Link href="/candidate/profile" className={cn(inkButton, "mt-1 h-12 px-[22px]")}>
                                {t("profile")}
                            </Link>
                        </>
                    )}
                </section>
            </main>
        </FocusRoot>
    );
}

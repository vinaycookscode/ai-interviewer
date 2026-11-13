import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { needsVerification } from "@/lib/email-verification";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { ResendVerification } from "@/components/auth/resend-verification";
import { coralButton } from "@/components/soft-glass/classes";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("VerifyEmail");
    return { title: t("checkTitle") };
}

const glass = "sg-glass inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-bold";

/** "Check your email", right after sign-up (AIIN-55), from the approved VerifyEmail board. */
export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const { next: raw } = await searchParams;
    const next = raw?.startsWith("/") && !raw.startsWith("//") ? raw : "/candidate/dashboard";
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");
    const pending = await needsVerification(session.user.id);
    if (!pending) redirect(next);
    const t = await getTranslations("VerifyEmail");

    return (
        <CardWrapper title={t("checkTitle")} description={t("checkBody", { email: pending.email })}>
            <div className="flex flex-col gap-3">
                <p className="flex gap-2.5 rounded-2xl bg-sg-row px-4 py-3 text-sm">
                    <Mail className="mt-0.5 size-[18px] shrink-0" aria-hidden="true" />
                    <span>{t("checkHint")}</span>
                </p>
                <ResendVerification label={t("resend")} className={cn(glass, "disabled:opacity-70")} />
                <Link href={next} className={cn(coralButton, "h-12 w-full")}>
                    {t(next.startsWith("/candidate/onboarding") ? "continueSetup" : "continue")}
                </Link>
            </div>
        </CardWrapper>
    );
}

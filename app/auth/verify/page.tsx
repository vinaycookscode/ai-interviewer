import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { needsVerification, verifyEmailToken } from "@/lib/email-verification";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { ResendVerification } from "@/components/auth/resend-verification";
import { coralButton, focusRing } from "@/components/soft-glass/classes";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("VerifyEmail");
    return { title: t("doneTitle"), robots: { index: false, follow: false } };
}

/** Where the email's link lands (AIIN-55): verified, or the link has expired. */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const { token } = await searchParams;
    const result = await verifyEmailToken(token);
    const t = await getTranslations("VerifyEmail");
    const session = await auth();
    // An old link opened by someone already verified: nothing to do
    const already = result === "expired" && !!session?.user?.id && !(await needsVerification(session.user.id));

    if (result === "done" || already)
        return (
            <CardWrapper title={t("doneTitle")} description={t("doneBody")}>
                <Link href="/candidate/practice" className={cn(coralButton, "h-12 w-full")}>
                    {t("startPractising")}
                </Link>
            </CardWrapper>
        );

    return (
        <CardWrapper title={t("expiredTitle")} description={t("expiredBody")}>
            {session?.user?.id ? (
                <div className="flex flex-col gap-3">
                    <ResendVerification label={t("newLink")} className={cn(coralButton, "h-12 w-full disabled:opacity-70")} />
                </div>
            ) : (
                <p className="text-center text-sm text-sg-muted">
                    {t.rich("signedOut", {
                        link: (chunks) => (
                            <Link href="/auth/login" className={cn("rounded font-bold text-sg-text", focusRing)}>
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            )}
        </CardWrapper>
    );
}

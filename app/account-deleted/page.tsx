import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { AmbientLight } from "@/components/soft-glass/ambient-light";
import { UMark } from "@/components/soft-glass/mascot";
import { ThemeSwitch } from "@/components/soft-glass/theme-switch";
import { inkButton } from "@/components/jobs/employer-ui";
import { softGlassFonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("DeleteAccount.done");
    return { title: t("metaTitle"), robots: { index: false } };
}

/** Where a candidate lands after deleting their account, signed out (AIIN-58, approved Account deleted artboard). */
export default async function AccountDeletedPage() {
    const t = await getTranslations("DeleteAccount.done");
    return (
        <div className={cn(softGlassFonts, "soft-glass relative min-h-screen overflow-x-clip text-base leading-6")}>
            <AmbientLight />
            <div className="relative mx-auto flex max-w-[1160px] flex-col gap-6 px-4 pb-10 pt-4 sm:px-8">
                <header className="sg-glass flex items-center justify-between gap-3 rounded-[28px] py-2 pl-3.5 pr-2">
                    <span className="flex items-center gap-2.5">
                        <UMark />
                        <span className="font-display sg-soft whitespace-nowrap text-lg font-semibold">Get Back To U</span>
                    </span>
                    <ThemeSwitch />
                </header>
                <main className="flex justify-center pt-4 sm:pt-16">
                    <section
                        role="status"
                        aria-labelledby="ad-title"
                        className="sg-glass sg-shadow-lg flex w-full max-w-[520px] flex-col items-center gap-3.5 rounded-[32px] p-6 text-center sm:p-9"
                    >
                        <span className="flex size-14 items-center justify-center rounded-[18px] bg-sg-chip">
                            <Check className="size-[26px]" aria-hidden="true" />
                        </span>
                        <h1 id="ad-title" className="font-display sg-soft text-balance text-[28px] font-semibold leading-[1.14] tracking-[-0.025em] sm:text-[36px]">
                            {t("title")}
                        </h1>
                        <p className="text-[17px] leading-[26px] text-sg-muted">{t("body")}</p>
                        <Link href="/" className={cn(inkButton, "h-12 px-5")}>
                            {t("home")}
                        </Link>
                    </section>
                </main>
            </div>
        </div>
    );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FocusRoot } from "@/components/interview/session-shell";
import { UMark } from "@/components/soft-glass/mascot";
import { inkButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";
import { CertificateHeader } from "./certificate-header";

export const metadata: Metadata = { title: "Certificate not found", robots: { index: false } };

export default async function CertificateNotFound() {
    const t = await getTranslations("Certificate");
    return (
        <FocusRoot>
            <CertificateHeader brand={t("brand")} home={t("home")} />
            <main className="flex justify-center pt-2 sm:pt-10">
                <section aria-labelledby="cert-missing" className="sg-glass sg-shadow-lg flex w-full max-w-[520px] flex-col items-center gap-3 rounded-[32px] p-6 text-center sm:p-9">
                    <UMark className="size-16" />
                    <h1 id="cert-missing" className="font-display sg-soft text-[28px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[36px]">
                        {t("notFoundTitle")}
                    </h1>
                    <p className="text-sg-muted">{t("notFoundBody")}</p>
                    <Link href="/" className={cn(inkButton, "mt-1 h-12 px-[22px]")}>
                        {t("notFoundHome")}
                    </Link>
                </section>
            </main>
        </FocusRoot>
    );
}

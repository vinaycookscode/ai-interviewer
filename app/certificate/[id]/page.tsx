import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { Link as LinkIcon } from "lucide-react";
import { db } from "@/lib/db";
import { APP_URL } from "@/lib/email";
import { CERTIFICATE_CODE } from "@/lib/achievements/rules";
import { FocusRoot } from "@/components/interview/session-shell";
import { UMark } from "@/components/soft-glass/mascot";
import { CopyLinkButton } from "@/components/candidate/copy-link-button";
import { glassButton, inkButton, label, row } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";
import { CertificateHeader } from "./certificate-header";

// Only what the certificate shows: name, plan, date and the code (AIIN-102). Never the user's email or id.
const loadCertificate = cache(async (id: string) => {
    if (!CERTIFICATE_CODE.test(id)) return null;
    return db.certificate.findUnique({
        where: { id },
        select: { id: true, name: true, planName: true, issuedAt: true, enrollment: { select: { program: { select: { description: true } } } } },
    });
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const certificate = await loadCertificate((await params).id);
    const t = await getTranslations("Certificate");
    // Open to anyone with the link, but kept out of search results
    return { title: certificate ? t("metaTitle", { plan: certificate.planName }) : t("notFoundMeta"), robots: { index: false } };
}

const longDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

/** The public certificate for finishing the 90-day plan. A wrong code is not found. */
export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
    const certificate = await loadCertificate((await params).id);
    if (!certificate) notFound();
    const t = await getTranslations("Certificate");

    const url = `${APP_URL}/certificate/${certificate.id}`;
    const issued = new Date(certificate.issuedAt.getTime() + 5.5 * 60 * 60 * 1000); // the IST calendar date
    const linkedin =
        "https://www.linkedin.com/profile/add?" +
        new URLSearchParams({
            startTask: "CERTIFICATION_NAME",
            name: certificate.planName,
            organizationName: t("brand"),
            issueYear: String(issued.getUTCFullYear()),
            issueMonth: String(issued.getUTCMonth() + 1),
            certUrl: url,
            certId: certificate.id,
        });
    const summary = certificate.enrollment.program.description.split("\n\n")[0];

    return (
        <FocusRoot>
            <CertificateHeader brand={t("brand")} home={t("home")} />
            <main className="flex justify-center pt-2 sm:pt-10">
                <section
                    aria-labelledby="cert-name"
                    className="sg-glass-strong sg-shadow-lg flex w-full max-w-[720px] flex-col items-center gap-3.5 rounded-[32px] border border-sg-glass-border p-7 text-center sm:p-14"
                >
                    <UMark className="size-16" />
                    <span className={cn(label, "tracking-[0.08em] uppercase")}>{t("kicker")}</span>
                    <h1 id="cert-name" className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] [overflow-wrap:anywhere] text-balance sm:text-[44px]">
                        {certificate.name}
                    </h1>
                    <p className="text-lg text-sg-muted">{t("finished")}</p>
                    <p className="font-display sg-soft text-[22px] leading-[1.25] font-semibold text-balance sm:text-[28px]">{certificate.planName}</p>
                    {summary && <p className="max-w-[560px] text-sg-muted">{summary}</p>}
                    <dl className="mt-2 grid w-full grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2">
                        <div className={row}>
                            <dt className={label}>{t("completed")}</dt>
                            <dd className="font-bold">{longDate.format(certificate.issuedAt)}</dd>
                        </div>
                        <div className={row}>
                            <dt className={label}>{t("verification")}</dt>
                            <dd className="font-bold tabular-nums">{certificate.id}</dd>
                        </div>
                    </dl>
                    <div className="flex flex-wrap justify-center gap-2.5 pt-1.5">
                        <a href={linkedin} target="_blank" rel="noreferrer" className={cn(inkButton, "h-12 px-[22px] text-base")}>
                            <LinkIcon className="size-[18px]" aria-hidden="true" />
                            {t("linkedin")}
                        </a>
                        <CopyLinkButton label={t("copy")} copiedLabel={t("copied")} failedLabel={t("copyFailed")} className={cn(glassButton, "h-12 px-[22px] text-base")} />
                    </div>
                    <p className="text-[13px] text-sg-muted">{t("issuer")}</p>
                </section>
            </main>
        </FocusRoot>
    );
}

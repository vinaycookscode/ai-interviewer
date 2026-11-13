import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { APP_URL } from "@/lib/email";
import { PageHeading, panel, panelTitle } from "@/components/jobs/employer-ui";
import { OpenLinkForm } from "@/components/drives/open-link-form";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("OpenLink");
    return { title: t("title") };
}

/** A drive's open link, with its QR code (AIIN-168). Only the drive's employer can open it. */
export default async function OpenLinkPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");
    const t = await getTranslations("OpenLink");
    const drive = await db.drive.findFirst({
        where: { id, employerId: userId },
        select: { id: true, name: true, openLinkSlug: true, openLinkOn: true, allowedDomains: true, joinCap: true, _count: { select: { candidates: { where: { source: "OPEN_LINK" } } } } },
    });
    if (!drive) notFound();
    const url = drive.openLinkSlug ? `${APP_URL}/drive/${drive.openLinkSlug}` : null;
    // Drawn on the server as SVG: no image service sees the link
    const qr = url ? await QRCode.toString(url, { type: "svg", margin: 2, errorCorrectionLevel: "M" }) : null;

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading back={{ href: `/dashboard/drives/${drive.id}`, label: drive.name }} title={t("title")} subtitle={t("subtitle")} />
            <div className="grid items-start gap-6 lg:grid-cols-2">
                <section aria-label={t("title")} className={cn(panel, "gap-4")}>
                    <OpenLinkForm
                        driveId={drive.id}
                        url={url}
                        joined={drive._count.candidates}
                        initial={{ on: drive.openLinkOn, domains: drive.allowedDomains.join(", "), cap: drive.joinCap === null ? "" : String(drive.joinCap) }}
                    />
                </section>
                <section aria-labelledby="ol-qr" className={cn(panel, "gap-4")}>
                    <h2 id="ol-qr" className={panelTitle}>
                        {t("qr")}
                    </h2>
                    {qr ? (
                        <div className="flex flex-wrap items-center gap-5">
                            <div role="img" aria-label={t("qr")} className="size-[168px] shrink-0 overflow-hidden rounded-2xl bg-white p-1 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
                            <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-2.5">
                                <span className="text-[13px] text-sg-muted">{t("qrHint")}</span>
                                <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`} download={`${drive.name.replace(/[^\w-]+/g, "-")}-qr.svg`} className="self-start text-sm font-bold underline">
                                    {t("download")}
                                </a>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-sg-muted">{t("notYet")}</p>
                    )}
                    <p className="flex items-start gap-2.5 rounded-2xl bg-sg-lavender-soft px-3.5 py-3 text-sm text-sg-lavender-ink">{t("how")}</p>
                </section>
            </div>
        </div>
    );
}

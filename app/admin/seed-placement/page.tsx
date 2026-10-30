import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Check, Info } from "lucide-react";
import { AdminHeading } from "@/components/admin/admin-ui";
import { panel, panelTitle } from "@/components/jobs/employer-ui";
import { SeedPlacementButton } from "./seed-button";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Admin.seed");
    return { title: t("metaTitle") };
}

/** Fills a new or test database (AIIN-138). The route it calls checks for an admin. */
export default async function AdminSeedPage() {
    const t = await getTranslations("Admin.seed");
    return (
        <>
            <AdminHeading title={t("title")} description={t("description")} />
            <section aria-labelledby="adds-title" className={panel + " max-w-[640px]"}>
                <h2 id="adds-title" className={panelTitle}>
                    {t("adds")}
                </h2>
                <ul className="flex flex-col gap-2">
                    {[t("flags"), t("program"), t("companies")].map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                            <Check className="mt-1 size-4 shrink-0 text-sg-lavender-ink" aria-hidden="true" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
                <p className="flex items-start gap-2.5 text-sm text-sg-muted">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{t("safe")}</span>
                </p>
                <SeedPlacementButton />
            </section>
        </>
    );
}

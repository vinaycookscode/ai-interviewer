import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getFeatureFlags } from "@/actions/feature-flags";
import { AdminHeading } from "@/components/admin/admin-ui";
import { GlobalFeatureToggle } from "@/components/admin/global-feature-toggle";
import { panel } from "@/components/jobs/employer-ui";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("Admin.features");
    return { title: t("metaTitle") };
}

const ORDER = ["CANDIDATE", "PLACEMENT", "CODE_EDITOR", "EMPLOYER", "COMMUNITY", "SYSTEM"];

/** Features on or off for everyone, grouped as people use them (AIIN-138). The toggle checks for an admin. */
export default async function AdminFeaturesPage() {
    const t = await getTranslations("Admin.features");
    const flags = await getFeatureFlags();
    const groups = new Map<string, typeof flags>();
    for (const flag of flags) {
        const cat = flag.category || "SYSTEM";
        groups.set(cat, [...(groups.get(cat) ?? []), flag]);
    }
    const categories = [...groups.keys()].sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
    const nameOf = (key: string) => (t.has(`names.${key}`) ? t(`names.${key}`) : key);

    return (
        <>
            <AdminHeading title={t("title")} description={t("description")} />
            <section className={panel + " max-w-[860px]"}>
                {categories.length === 0 && <p className="text-sg-muted">{t("none")}</p>}
                {categories.map((cat) => (
                    <section key={cat} aria-labelledby={`cat-${cat}`} className="flex flex-col gap-1.5">
                        <h2 id={`cat-${cat}`} className="text-[13px] leading-[18px] font-bold text-sg-muted">
                            {t.has(`categories.${cat}`) ? t(`categories.${cat}`) : cat}
                        </h2>
                        <ul className="flex flex-col gap-1.5">
                            {groups.get(cat)!.map((flag) => (
                                <li key={flag.key} className="flex flex-wrap items-center gap-3.5 rounded-[18px] bg-sg-row px-4 py-3.5">
                                    <span className="flex min-w-0 flex-[1_1_240px] flex-col">
                                        <span className="font-bold">{nameOf(flag.key)}</span>
                                        <span className="text-sm text-sg-muted [overflow-wrap:anywhere]">
                                            {flag.description ? `${flag.description} · ` : ""}
                                            <code className="font-mono text-[13px]">{flag.key}</code>
                                        </span>
                                    </span>
                                    <GlobalFeatureToggle featureKey={flag.key} name={nameOf(flag.key)} initialValue={flag.enabled} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </section>
        </>
    );
}

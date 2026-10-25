import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeading, panel, panelTitle } from "@/components/jobs/employer-ui";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/auth/login");

    const t = await getTranslations("Employer.settings");
    const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (!user) redirect("/auth/login");

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading title={t("title")} subtitle={t("subtitle")} />
            <div className="flex w-full max-w-[760px] flex-col gap-5">
                <section aria-labelledby="settings-account" className={panel}>
                    <h2 id="settings-account" className={panelTitle}>
                        {t("account")}
                    </h2>
                    <SettingsForm name={user.name ?? ""} email={user.email} />
                </section>
                <section aria-labelledby="settings-close" className={panel}>
                    <h2 id="settings-close" className={panelTitle}>
                        {t("closeTitle")}
                    </h2>
                    <p className="text-[15px] leading-[23px] text-sg-muted">{t("closeBody")}</p>
                </section>
            </div>
        </div>
    );
}

import { getTranslations } from "next-intl/server";
import { SystemPage } from "@/components/layout/system-page";

export default async function NotFound() {
    const t = await getTranslations("System");
    return (
        <SystemPage
            brand={t("brand")}
            homeLabel={t("home")}
            eyebrow={t("notFound.eyebrow")}
            title={t("notFound.title")}
            body={t("notFound.body")}
            primary={{ label: t("dashboard"), href: "/dashboard" }}
            secondary={{ label: t("backHome"), href: "/" }}
        />
    );
}

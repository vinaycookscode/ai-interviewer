"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RotateCw } from "lucide-react";
import { SystemPage } from "@/components/layout/system-page";
import { errorReference } from "@/lib/error-reference";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const t = useTranslations("System");

    useEffect(() => {
        console.error(error);
    }, [error]);

    const code = errorReference(error.digest);

    return (
        <SystemPage
            brand={t("brand")}
            homeLabel={t("home")}
            eyebrow={t("error.eyebrow")}
            title={t("error.title")}
            body={t("error.body")}
            primary={{ label: t("error.retry"), onClick: reset, icon: <RotateCw className="size-[18px]" aria-hidden="true" /> }}
            secondary={{ label: t("dashboard"), href: "/dashboard" }}
            reference={code ? t("error.reference", { code }) : undefined}
        />
    );
}

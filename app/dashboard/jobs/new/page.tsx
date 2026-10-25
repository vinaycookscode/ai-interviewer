import { getTranslations } from "next-intl/server";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { CreateJobForm } from "@/components/jobs/create-job-form";
import { PageHeading, panel } from "@/components/jobs/employer-ui";

export default async function NewJobPage() {
    const t = await getTranslations("Employer.form");
    const isEnabled = await checkFeature(FEATURES.JOB_MANAGEMENT);

    if (!isEnabled) {
        return (
            <div className="flex flex-col gap-6 sm:gap-9">
                <PageHeading back={{ href: "/dashboard/jobs", label: t("back") }} title={t("newTitle")} />
                <section className={cn(panel, "max-w-[560px] items-center text-center")}>
                    <span className="inline-flex size-12 items-center justify-center rounded-full bg-sg-chip">
                        <Lock className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className="font-display sg-soft text-[22px] leading-7 font-semibold">{t("lockedTitle")}</h2>
                    <p className="text-sg-muted">{t("lockedBody")}</p>
                </section>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <PageHeading back={{ href: "/dashboard/jobs", label: t("back") }} title={t("newTitle")} subtitle={t("subtitle")} />
            <CreateJobForm />
        </div>
    );
}

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFeature } from "@/actions/feature-flags";
import { getCurrentSubscription } from "@/actions/subscription";
import { FEATURES } from "@/lib/features";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { CompanyList, type CompanyCard } from "@/components/company-prep/company-list";
import { formatSalaryRange } from "@/lib/company-prep-format";

export default async function CompanyPrepPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const t = await getTranslations("CompanyPrep");

    if (!(await checkFeature(FEATURES.COMPANY_PREP))) {
        return <p className="py-16 text-center text-sg-muted">{t("unavailable")}</p>;
    }

    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;
    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} description={t("upgrade")} />;
    }

    const kits = await db.companyPrepKit.findMany({
        orderBy: { company: "asc" },
        select: {
            slug: true,
            company: true,
            description: true,
            difficulty: true,
            rounds: true,
            salaryRange: true,
            // Only published problems count (AIIN-107)
            _count: { select: { questions: { where: { status: "PUBLISHED" } } } },
        },
    });

    const companies: CompanyCard[] = kits.map((kit) => ({
        slug: kit.slug,
        name: kit.company,
        description: kit.description,
        difficulty: kit.difficulty,
        rounds: Array.isArray(kit.rounds) ? kit.rounds.length : 0,
        questions: kit._count.questions,
        salary: formatSalaryRange(kit.salaryRange),
    }));

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[680px] flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">
                    {t("title")}
                </h1>
                <p className="text-lg text-sg-muted">{t("description")}</p>
            </div>
            <CompanyList companies={companies} />
        </div>
    );
}

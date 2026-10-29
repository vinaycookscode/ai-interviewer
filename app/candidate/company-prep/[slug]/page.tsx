import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkFeature } from "@/actions/feature-flags";
import { getCurrentSubscription } from "@/actions/subscription";
import { FEATURES } from "@/lib/features";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { formatSalaryRange } from "@/lib/company-prep-format";
import { CompanyDetailClient, type CompanyRound, type CompanyGuide } from "./client";

interface PageProps {
    params: Promise<{ slug: string }>;
}

function asRounds(value: unknown): CompanyRound[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
        .map((r) => ({
            name: String(r.name ?? ""),
            type: String(r.type ?? ""),
            duration: typeof r.duration === "number" ? r.duration : null,
            tips: typeof r.tips === "string" ? r.tips : null,
        }));
}

function asGuide(value: unknown): CompanyGuide | null {
    if (!value || typeof value !== "object") return null;
    const c = value as Record<string, unknown>;
    const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
    return {
        overview: typeof c.overview === "string" ? c.overview : "",
        culture: list(c.culture),
        interviewTips: list(c.interviewTips),
        preparationStrategy: typeof c.preparationStrategy === "string" ? c.preparationStrategy : "",
    };
}

export default async function CompanyDetailPage({ params }: PageProps) {
    const { slug } = await params;

    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const t = await getTranslations("CompanyPrep");

    if (!(await checkFeature(FEATURES.COMPANY_PREP))) {
        return <p className="py-16 text-center text-sg-muted">{t("unavailable")}</p>;
    }

    // Same plan check as the list, so a company can't be opened directly by URL on the free plan.
    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;
    if (isFreeUser) {
        return <UpgradePrompt feature={t("title")} description={t("upgrade")} />;
    }

    const [languageSelector, codePersistence, aiCodeAnalysis, kit] = await Promise.all([
        checkFeature(FEATURES.CODE_EDITOR_LANGUAGE_SELECTOR),
        checkFeature(FEATURES.CODE_PERSISTENCE),
        checkFeature(FEATURES.AI_CODE_ANALYSIS),
        db.companyPrepKit.findUnique({
            where: { slug },
            select: {
                company: true,
                slug: true,
                difficulty: true,
                rounds: true,
                salaryRange: true,
                content: true,
                questions: {
                    orderBy: [{ frequency: "desc" }, { createdAt: "desc" }],
                    select: {
                        id: true,
                        question: true,
                        description: true,
                        type: true,
                        difficulty: true,
                        frequency: true,
                        answer: true,
                        tips: true,
                        tags: true,
                        starterCode: true,
                        solutionCode: true,
                        testCases: true,
                        language: true,
                    },
                },
            },
        }),
    ]);

    if (!kit) notFound();

    const solved = await db.userCompanySolution.findMany({
        where: { userId: session.user.id, questionId: { in: kit.questions.map((q) => q.id) } },
        select: { questionId: true },
        distinct: ["questionId"],
    });

    return (
        <CompanyDetailClient
            company={{
                name: kit.company,
                slug: kit.slug,
                difficulty: kit.difficulty,
                salary: formatSalaryRange(kit.salaryRange),
                rounds: asRounds(kit.rounds),
                guide: asGuide(kit.content),
            }}
            questions={kit.questions.map((q) => ({ ...q, testCases: Array.isArray(q.testCases) ? q.testCases : [] }))}
            solvedIds={solved.map((s) => s.questionId)}
            featureFlags={{ languageSelector, codePersistence, aiCodeAnalysis }}
        />
    );
}

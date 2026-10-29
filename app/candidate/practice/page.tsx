import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { PracticeView, type RecentPractice } from "@/components/candidate/practice-view";
import { Lock } from "lucide-react";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { checkUsageLimit } from "@/lib/usage";

const LEVELS = ["Junior", "Mid", "Senior"];

export default async function PracticePage({
    searchParams,
}: {
    searchParams: Promise<{ role?: string; level?: string }>;
}) {
    const t = await getTranslations("PracticeInterviews");
    const isEnabled = await checkFeature(FEATURES.PRACTICE_INTERVIEWS);

    if (!isEnabled) {
        return (
            <div className="flex flex-1 items-center justify-center py-10">
                <div className="sg-glass flex w-full max-w-md flex-col items-center gap-4 rounded-[24px] p-6 text-center sm:rounded-[28px] sm:p-8">
                    <span className="flex size-12 items-center justify-center rounded-full bg-sg-chip text-sg-muted">
                        <Lock className="size-6" aria-hidden="true" />
                    </span>
                    <h1 className="font-display sg-soft text-[28px] font-semibold leading-[34px]">{t("unavailable.title")}</h1>
                    <p className="text-sg-muted">{t("unavailable.description")}</p>
                </div>
            </div>
        );
    }

    const session = await auth();
    const userId = session?.user?.id;

    // Read-only: the same check createMockInterview runs, shown up front.
    const [usage, recentRows] = await Promise.all([
        checkUsageLimit("mock_interview"),
        userId
            ? db.mockInterview.findMany({
                  where: { userId },
                  orderBy: { createdAt: "desc" },
                  take: 3,
                  select: { id: true, role: true, difficulty: true, score: true, createdAt: true },
              })
            : Promise.resolve([]),
    ]);

    // Every plan's monthly allowance is enforced by createMockInterview; Free gets 2 (AIIN-189). Only a plan without practice is blocked.
    if (usage.limit === 0) {
        return <UpgradePrompt feature={t("title")} />;
    }

    const recent: RecentPractice[] = recentRows.map((row) => ({
        id: row.id,
        role: row.role,
        difficulty: row.difficulty,
        score: row.score,
        date: row.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    }));

    const { role, level } = await searchParams;

    return (
        <PracticeView
            allowance={usage.limit > 0 ? { remaining: usage.remaining, limit: usage.limit } : null}
            recent={recent}
            initialRole={role?.slice(0, 100) ?? ""}
            initialLevel={level && LEVELS.includes(level) ? level : "Junior"}
        />
    );
}

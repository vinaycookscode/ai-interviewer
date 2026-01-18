import { db } from "@/lib/db";
import { auth } from "@/auth";
import { PlanTier } from "@prisma/client";


// Feature types that can be tracked
export type FeatureType =
    | "mock_interview"
    | "resume_analysis"
    | "question_generation"
    | "cover_letter"
    | "resume_rewrite";

// Map feature types to plan limit fields
const FEATURE_LIMIT_MAP: Record<FeatureType, keyof {
    mockInterviewLimit: number;
    resumeAnalysisLimit: number;
    questionGenerationLimit: number;
    coverLetterLimit: number;
    resumeRewriteLimit: number;
}> = {
    mock_interview: "mockInterviewLimit",
    resume_analysis: "resumeAnalysisLimit",
    question_generation: "questionGenerationLimit",
    cover_letter: "coverLetterLimit",
    resume_rewrite: "resumeRewriteLimit",
};

// Get the current billing period dates
function getCurrentPeriodDates(): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

// Get user's current plan limits
async function getUserPlanLimits(userId: string) {
    const subscription = await db.subscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    // If no subscription, return free tier limits
    if (!subscription || subscription.status !== "ACTIVE") {
        const freePlan = await db.subscriptionPlan.findUnique({
            where: { tier: PlanTier.FREE },
        });

        return freePlan || {
            mockInterviewLimit: 2,
            resumeAnalysisLimit: 1,
            questionGenerationLimit: 5,
            coverLetterLimit: 0,
            resumeRewriteLimit: 0,
            aiEvaluationEnabled: false,
            prioritySupport: false,
        };
    }

    return subscription.plan;
}

// Check if user can use a feature
export async function checkUsageLimit(
    featureType: FeatureType
): Promise<{
    allowed: boolean;
    message?: string;
    currentUsage: number;
    limit: number;
    remaining: number;
}> {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            allowed: false,
            message: "Please sign in to use this feature",
            currentUsage: 0,
            limit: 0,
            remaining: 0,
        };
    }

    const userId = session.user.id;
    const plan = await getUserPlanLimits(userId);
    const limitField = FEATURE_LIMIT_MAP[featureType];
    const limit = plan[limitField] as number;

    // -1 means unlimited
    if (limit === -1) {
        return {
            allowed: true,
            currentUsage: 0,
            limit: -1,
            remaining: -1,
        };
    }

    // Check if feature is disabled (limit = 0)
    if (limit === 0) {
        return {
            allowed: false,
            message: "This feature is not available on your current plan. Please upgrade to access it.",
            currentUsage: 0,
            limit: 0,
            remaining: 0,
        };
    }

    // Get current period usage
    const { start, end } = getCurrentPeriodDates();
    const usageRecord = await db.usageRecord.findUnique({
        where: {
            userId_featureType_periodStart: {
                userId,
                featureType,
                periodStart: start,
            },
        },
    });

    const currentUsage = usageRecord?.usageCount || 0;
    const remaining = Math.max(0, limit - currentUsage);

    if (currentUsage >= limit) {
        return {
            allowed: false,
            message: `You've reached your monthly limit of ${limit} ${featureType.replace("_", " ")}(s). Upgrade your plan for more.`,
            currentUsage,
            limit,
            remaining: 0,
        };
    }

    return {
        allowed: true,
        currentUsage,
        limit,
        remaining,
    };
}

// Increment usage count for a feature
export async function incrementUsage(featureType: FeatureType): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;

    const userId = session.user.id;
    const { start, end } = getCurrentPeriodDates();

    await db.usageRecord.upsert({
        where: {
            userId_featureType_periodStart: {
                userId,
                featureType,
                periodStart: start,
            },
        },
        update: {
            usageCount: { increment: 1 },
        },
        create: {
            userId,
            featureType,
            periodStart: start,
            periodEnd: end,
            usageCount: 1,
        },
    });
}

// Get usage stats for all features
export async function getUsageStats(): Promise<{
    features: Array<{
        featureType: FeatureType;
        displayName: string;
        currentUsage: number;
        limit: number;
        remaining: number;
        percentUsed: number;
    }>;
    plan: {
        name: string;
        tier: PlanTier;
    };
}> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const userId = session.user.id;
    const plan = await getUserPlanLimits(userId);
    const { start } = getCurrentPeriodDates();

    // Get all usage records for current period
    const usageRecords = await db.usageRecord.findMany({
        where: {
            userId,
            periodStart: start,
        },
    });

    const usageMap = new Map(
        usageRecords.map((r) => [r.featureType, r.usageCount])
    );

    const features: Array<{
        featureType: FeatureType;
        displayName: string;
        currentUsage: number;
        limit: number;
        remaining: number;
        percentUsed: number;
    }> = [
            {
                featureType: "mock_interview",
                displayName: "Mock Interviews",
                currentUsage: usageMap.get("mock_interview") || 0,
                limit: plan.mockInterviewLimit,
                remaining: Math.max(0, plan.mockInterviewLimit - (usageMap.get("mock_interview") || 0)),
                percentUsed: plan.mockInterviewLimit === -1 ? 0 :
                    plan.mockInterviewLimit === 0 ? 100 :
                        Math.round(((usageMap.get("mock_interview") || 0) / plan.mockInterviewLimit) * 100),
            },
            {
                featureType: "resume_analysis",
                displayName: "Resume Analysis",
                currentUsage: usageMap.get("resume_analysis") || 0,
                limit: plan.resumeAnalysisLimit,
                remaining: Math.max(0, plan.resumeAnalysisLimit - (usageMap.get("resume_analysis") || 0)),
                percentUsed: plan.resumeAnalysisLimit === -1 ? 0 :
                    plan.resumeAnalysisLimit === 0 ? 100 :
                        Math.round(((usageMap.get("resume_analysis") || 0) / plan.resumeAnalysisLimit) * 100),
            },
            {
                featureType: "question_generation",
                displayName: "AI Question Generation",
                currentUsage: usageMap.get("question_generation") || 0,
                limit: plan.questionGenerationLimit,
                remaining: Math.max(0, plan.questionGenerationLimit - (usageMap.get("question_generation") || 0)),
                percentUsed: plan.questionGenerationLimit === -1 ? 0 :
                    plan.questionGenerationLimit === 0 ? 100 :
                        Math.round(((usageMap.get("question_generation") || 0) / plan.questionGenerationLimit) * 100),
            },
            {
                featureType: "cover_letter",
                displayName: "Cover Letter Generation",
                currentUsage: usageMap.get("cover_letter") || 0,
                limit: plan.coverLetterLimit,
                remaining: Math.max(0, plan.coverLetterLimit - (usageMap.get("cover_letter") || 0)),
                percentUsed: plan.coverLetterLimit === -1 ? 0 :
                    plan.coverLetterLimit === 0 ? 100 :
                        Math.round(((usageMap.get("cover_letter") || 0) / plan.coverLetterLimit) * 100),
            },
            {
                featureType: "resume_rewrite",
                displayName: "Resume Rewriting",
                currentUsage: usageMap.get("resume_rewrite") || 0,
                limit: plan.resumeRewriteLimit,
                remaining: Math.max(0, plan.resumeRewriteLimit - (usageMap.get("resume_rewrite") || 0)),
                percentUsed: plan.resumeRewriteLimit === -1 ? 0 :
                    plan.resumeRewriteLimit === 0 ? 100 :
                        Math.round(((usageMap.get("resume_rewrite") || 0) / plan.resumeRewriteLimit) * 100),
            },
        ];

    // Get subscription for plan name
    const subscription = await db.subscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    return {
        features,
        plan: {
            name: subscription?.plan.name || "Free",
            tier: subscription?.plan.tier || PlanTier.FREE,
        },
    };
}

// Check if user has a specific feature enabled (like AI evaluation)
export async function hasFeatureEnabled(
    feature: "aiEvaluationEnabled" | "prioritySupport"
): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) return false;

    const plan = await getUserPlanLimits(session.user.id);
    return plan[feature] as boolean;
}

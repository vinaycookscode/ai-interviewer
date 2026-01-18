"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRazorpayInstance, toRupees } from "@/lib/razorpay";
import { PlanTier } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Check admin access
async function checkAdminAccess() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required");
    }
    return session;
}

// Get Razorpay account balance
export async function getRazorpayBalance() {
    await checkAdminAccess();

    try {
        const razorpay = getRazorpayInstance();
        const balance = await razorpay.payments.all({ count: 1 }); // Workaround to check connection

        // Note: Razorpay doesn't have a direct balance API for standard accounts
        // We'll calculate from our database instead
        const totalRevenue = await db.payment.aggregate({
            where: { status: "captured" },
            _sum: { amount: true },
        });

        return {
            success: true,
            totalRevenue: totalRevenue._sum.amount || 0,
            totalRevenueDisplay: toRupees(totalRevenue._sum.amount || 0),
        };
    } catch (error: any) {
        console.error("Failed to get balance:", error);
        return { success: false, error: error.message };
    }
}

// Get subscription statistics
export async function getSubscriptionStats() {
    await checkAdminAccess();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total active subscriptions by tier
    const subscriptionsByTier = await db.subscription.groupBy({
        by: ["status"],
        where: { status: "ACTIVE" },
        _count: true,
    });

    // Get counts by plan tier
    const activeByPlan = await db.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
    });

    const planCounts = {
        PRO: activeByPlan.filter(s => s.plan.tier === "PRO").length,
        PREMIUM: activeByPlan.filter(s => s.plan.tier === "PREMIUM").length,
    };

    // Today's purchases
    const todayPurchases = await db.payment.count({
        where: {
            createdAt: { gte: startOfToday },
            status: "captured",
        },
    });

    // This month's revenue
    const monthRevenue = await db.payment.aggregate({
        where: {
            createdAt: { gte: startOfMonth },
            status: "captured",
        },
        _sum: { amount: true },
    });

    // Total revenue
    const totalRevenue = await db.payment.aggregate({
        where: { status: "captured" },
        _sum: { amount: true },
    });

    return {
        activeSubscriptions: activeByPlan.length,
        proSubscribers: planCounts.PRO,
        premiumSubscribers: planCounts.PREMIUM,
        todayPurchases,
        monthRevenue: toRupees(monthRevenue._sum.amount || 0),
        totalRevenue: toRupees(totalRevenue._sum.amount || 0),
    };
}

// Get today's subscribers
export async function getTodaySubscribers() {
    await checkAdminAccess();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySubscriptions = await db.subscription.findMany({
        where: {
            OR: [
                { createdAt: { gte: startOfToday } },
                { updatedAt: { gte: startOfToday } },
            ],
            status: "ACTIVE",
        },
        include: {
            user: {
                select: { id: true, name: true, email: true, image: true },
            },
            plan: true,
            payments: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
        orderBy: { updatedAt: "desc" },
    });

    return todaySubscriptions.map(sub => {
        const now = new Date();
        const daysRemaining = Math.ceil(
            (sub.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
            id: sub.id,
            user: sub.user,
            plan: sub.plan.name,
            tier: sub.plan.tier,
            billingPeriod: sub.billingPeriod,
            daysRemaining: Math.max(0, daysRemaining),
            currentPeriodEnd: sub.currentPeriodEnd,
            amount: sub.payments[0] ? toRupees(sub.payments[0].amount) : 0,
            createdAt: sub.createdAt,
        };
    });
}

// Get all subscribers with pagination
export async function getAllSubscribers(page = 1, limit = 20) {
    await checkAdminAccess();

    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
        db.subscription.findMany({
            include: {
                user: {
                    select: { id: true, name: true, email: true, image: true },
                },
                plan: true,
                payments: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        db.subscription.count(),
    ]);

    const subscribers = subscriptions.map(sub => {
        const now = new Date();
        const daysRemaining = Math.ceil(
            (sub.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
            id: sub.id,
            user: sub.user,
            plan: sub.plan.name,
            tier: sub.plan.tier,
            billingPeriod: sub.billingPeriod,
            status: sub.status,
            daysRemaining: Math.max(0, daysRemaining),
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            totalPaid: sub.payments[0] ? toRupees(sub.payments[0].amount) : 0,
            createdAt: sub.createdAt,
        };
    });

    return {
        subscribers,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// Get all subscription plans
export async function getAdminSubscriptionPlans() {
    await checkAdminAccess();

    const plans = await db.subscriptionPlan.findMany({
        orderBy: { monthlyPrice: "asc" },
    });

    // Get subscriber counts per plan
    const subscriberCounts = await db.subscription.groupBy({
        by: ["planId"],
        where: { status: "ACTIVE" },
        _count: true,
    });

    const countMap = new Map(subscriberCounts.map(c => [c.planId, c._count]));

    return plans.map(plan => ({
        ...plan,
        monthlyPriceDisplay: toRupees(plan.monthlyPrice),
        yearlyPriceDisplay: toRupees(plan.yearlyPrice),
        activeSubscribers: countMap.get(plan.id) || 0,
    }));
}

// Update subscription plan
export async function updateSubscriptionPlan(
    planId: string,
    data: {
        name?: string;
        monthlyPrice?: number;
        yearlyPrice?: number;
        mockInterviewLimit?: number;
        resumeAnalysisLimit?: number;
        questionGenerationLimit?: number;
        coverLetterLimit?: number;
        resumeRewriteLimit?: number;
        aiEvaluationEnabled?: boolean;
        prioritySupport?: boolean;
    }
) {
    await checkAdminAccess();

    try {
        const updated = await db.subscriptionPlan.update({
            where: { id: planId },
            data,
        });

        revalidatePath("/admin/subscriptions");
        revalidatePath("/candidate/pricing");

        return { success: true, plan: updated };
    } catch (error: any) {
        console.error("Failed to update plan:", error);
        return { success: false, error: error.message };
    }
}

// Create a new subscription plan (if needed)
export async function createSubscriptionPlan(data: {
    name: string;
    tier: PlanTier;
    monthlyPrice: number;
    yearlyPrice: number;
    mockInterviewLimit: number;
    resumeAnalysisLimit: number;
    questionGenerationLimit: number;
    coverLetterLimit: number;
    resumeRewriteLimit: number;
    aiEvaluationEnabled: boolean;
    prioritySupport: boolean;
}) {
    await checkAdminAccess();

    try {
        const plan = await db.subscriptionPlan.create({
            data,
        });

        revalidatePath("/admin/subscriptions");
        revalidatePath("/candidate/pricing");

        return { success: true, plan };
    } catch (error: any) {
        console.error("Failed to create plan:", error);
        return { success: false, error: error.message };
    }
}

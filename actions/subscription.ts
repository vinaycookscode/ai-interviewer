"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getRazorpayInstance, getRazorpayKeyId, toPaise, toRupees } from "@/lib/razorpay";
import { BillingPeriod, PlanTier, SubscriptionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// Get all available subscription plans
export async function getSubscriptionPlans() {
    const plans = await db.subscriptionPlan.findMany({
        orderBy: { monthlyPrice: "asc" },
    });

    return plans.map((plan) => ({
        ...plan,
        monthlyPriceDisplay: toRupees(plan.monthlyPrice),
        yearlyPriceDisplay: toRupees(plan.yearlyPrice),
        yearlySavings: plan.monthlyPrice > 0
            ? toRupees((plan.monthlyPrice * 12) - plan.yearlyPrice)
            : 0,
    }));
}

// Get current user's subscription
export async function getCurrentSubscription() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    const subscription = await db.subscription.findUnique({
        where: { userId: session.user.id },
        include: {
            plan: true,
            payments: {
                orderBy: { createdAt: "desc" },
                take: 10,
            },
        },
    });

    if (!subscription) {
        // Return free tier info
        const freePlan = await db.subscriptionPlan.findUnique({
            where: { tier: PlanTier.FREE },
        });

        return {
            plan: freePlan,
            status: "ACTIVE" as SubscriptionStatus,
            billingPeriod: "MONTHLY" as BillingPeriod,
            isFree: true,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
            payments: [],
        };
    }

    return {
        ...subscription,
        isFree: subscription.plan.tier === PlanTier.FREE,
        plan: {
            ...subscription.plan,
            monthlyPriceDisplay: toRupees(subscription.plan.monthlyPrice),
            yearlyPriceDisplay: toRupees(subscription.plan.yearlyPrice),
        },
    };
}

// Create Razorpay order for subscription
export async function createSubscriptionOrder(
    planTier: PlanTier,
    billingPeriod: BillingPeriod
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Please sign in to subscribe" };
    }

    try {
        const plan = await db.subscriptionPlan.findUnique({
            where: { tier: planTier },
        });

        if (!plan) {
            return { success: false, error: "Plan not found" };
        }

        // Free plan doesn't need payment
        if (plan.tier === PlanTier.FREE) {
            return { success: false, error: "Free plan doesn't require payment" };
        }

        const amount = billingPeriod === BillingPeriod.YEARLY
            ? plan.yearlyPrice
            : plan.monthlyPrice;

        if (amount === 0) {
            return { success: false, error: "Invalid plan pricing" };
        }

        const razorpay = getRazorpayInstance();

        // Create Razorpay order (receipt max 40 chars)
        const shortUserId = session.user.id.slice(0, 8);
        const timestamp = Date.now().toString(36); // base36 for shorter string
        const order = await razorpay.orders.create({
            amount: amount,
            currency: "INR",
            receipt: `sub_${shortUserId}_${timestamp}`,
            notes: {
                userId: session.user.id,
                planId: plan.id,
                planTier: planTier,
                billingPeriod: billingPeriod,
            },
        });


        // Get user details for prefill
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true },
        });

        return {
            success: true,
            orderId: order.id,
            amount: amount,
            currency: "INR",
            keyId: getRazorpayKeyId(),
            prefill: {
                name: user?.name || "",
                email: user?.email || "",
            },
            planId: plan.id,
            billingPeriod: billingPeriod,
        };
    } catch (error: any) {
        console.error("Failed to create subscription order:", error);
        return { success: false, error: error.message || "Failed to create order" };
    }
}

// Verify and activate subscription after payment
export async function verifyAndActivateSubscription(
    orderId: string,
    paymentId: string,
    signature: string,
    planId: string,
    billingPeriod: BillingPeriod
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Please sign in" };
    }

    try {
        // Verify signature
        const { verifyPaymentSignature } = await import("@/lib/razorpay");
        const isValid = verifyPaymentSignature(orderId, paymentId, signature);

        if (!isValid) {
            return { success: false, error: "Invalid payment signature" };
        }

        const plan = await db.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            return { success: false, error: "Plan not found" };
        }

        // Calculate period dates
        const now = new Date();
        const periodEnd = new Date(now);
        if (billingPeriod === BillingPeriod.YEARLY) {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        // Create or update subscription
        const subscription = await db.subscription.upsert({
            where: { userId: session.user.id },
            create: {
                userId: session.user.id,
                planId: planId,
                status: SubscriptionStatus.ACTIVE,
                billingPeriod: billingPeriod,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
            },
            update: {
                planId: planId,
                status: SubscriptionStatus.ACTIVE,
                billingPeriod: billingPeriod,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                cancelledAt: null,
            },
        });

        // Record payment
        const amount = billingPeriod === BillingPeriod.YEARLY
            ? plan.yearlyPrice
            : plan.monthlyPrice;

        await db.payment.create({
            data: {
                subscriptionId: subscription.id,
                amount: amount,
                currency: "INR",
                status: "captured",
                razorpayPaymentId: paymentId,
                razorpayOrderId: orderId,
                razorpaySignature: signature,
            },
        });

        revalidatePath("/settings/subscription");
        revalidatePath("/pricing");

        return {
            success: true,
            message: `Successfully subscribed to ${plan.name}!`,
            subscription: subscription,
        };
    } catch (error: any) {
        console.error("Failed to verify and activate subscription:", error);
        return { success: false, error: error.message || "Failed to activate subscription" };
    }
}

// Cancel subscription
export async function cancelSubscription() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Please sign in" };
    }

    try {
        const subscription = await db.subscription.findUnique({
            where: { userId: session.user.id },
            include: { plan: true },
        });

        if (!subscription) {
            return { success: false, error: "No active subscription found" };
        }

        if (subscription.plan.tier === PlanTier.FREE) {
            return { success: false, error: "Cannot cancel free plan" };
        }

        // Mark as cancelled but don't remove until period ends
        await db.subscription.update({
            where: { id: subscription.id },
            data: {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
            },
        });

        // If using Razorpay subscription (recurring), cancel it
        if (subscription.razorpaySubscriptionId) {
            try {
                const razorpay = getRazorpayInstance();
                await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);
            } catch (error) {
                console.error("Failed to cancel Razorpay subscription:", error);
            }
        }

        revalidatePath("/settings/subscription");

        return {
            success: true,
            message: `Subscription cancelled. You'll have access until ${subscription.currentPeriodEnd.toLocaleDateString()}.`,
        };
    } catch (error: any) {
        console.error("Failed to cancel subscription:", error);
        return { success: false, error: error.message || "Failed to cancel subscription" };
    }
}

// Downgrade to free plan (immediate)
export async function downgradeToFree() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Please sign in" };
    }

    try {
        const freePlan = await db.subscriptionPlan.findUnique({
            where: { tier: PlanTier.FREE },
        });

        if (!freePlan) {
            return { success: false, error: "Free plan not found" };
        }

        const subscription = await db.subscription.findUnique({
            where: { userId: session.user.id },
        });

        if (subscription) {
            // If using Razorpay subscription (recurring), cancel it
            if (subscription.razorpaySubscriptionId) {
                try {
                    const razorpay = getRazorpayInstance();
                    await razorpay.subscriptions.cancel(subscription.razorpaySubscriptionId);
                } catch (error) {
                    console.error("Failed to cancel Razorpay subscription:", error);
                }
            }

            await db.subscription.update({
                where: { id: subscription.id },
                data: {
                    planId: freePlan.id,
                    status: SubscriptionStatus.ACTIVE,
                    razorpaySubscriptionId: null,
                    cancelledAt: null,
                },
            });
        }

        revalidatePath("/settings/subscription");

        return { success: true, message: "Downgraded to Free plan" };
    } catch (error: any) {
        console.error("Failed to downgrade:", error);
        return { success: false, error: error.message || "Failed to downgrade" };
    }
}

// Seed subscription plans (run once during setup)
export async function seedSubscriptionPlans() {
    const plans = [
        {
            name: "Free",
            tier: PlanTier.FREE,
            monthlyPrice: 0,
            yearlyPrice: 0,
            mockInterviewLimit: 2,
            resumeAnalysisLimit: 1,
            questionGenerationLimit: 5,
            coverLetterLimit: 0,
            resumeRewriteLimit: 0,
            aiEvaluationEnabled: false,
            prioritySupport: false,
        },
        {
            name: "Pro",
            tier: PlanTier.PRO,
            monthlyPrice: toPaise(249), // ₹249
            yearlyPrice: toPaise(2490), // ₹2490
            mockInterviewLimit: 15,
            resumeAnalysisLimit: 10,
            questionGenerationLimit: 50,
            coverLetterLimit: 5,
            resumeRewriteLimit: 3,
            aiEvaluationEnabled: true,
            prioritySupport: false,
        },
        {
            name: "Premium",
            tier: PlanTier.PREMIUM,
            monthlyPrice: toPaise(499), // ₹499
            yearlyPrice: toPaise(4990), // ₹4990
            mockInterviewLimit: -1, // Unlimited
            resumeAnalysisLimit: -1,
            questionGenerationLimit: -1,
            coverLetterLimit: -1,
            resumeRewriteLimit: -1,
            aiEvaluationEnabled: true,
            prioritySupport: true,
        },
    ];

    for (const plan of plans) {
        await db.subscriptionPlan.upsert({
            where: { tier: plan.tier },
            update: plan,
            create: plan,
        });
    }

    return { success: true, message: "Subscription plans seeded successfully" };
}

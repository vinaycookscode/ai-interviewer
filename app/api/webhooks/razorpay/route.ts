import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { SubscriptionStatus, PlanTier } from "@prisma/client";

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 400 }
            );
        }

        // Verify webhook signature
        const isValid = verifyWebhookSignature(body, signature);
        if (!isValid) {
            console.error("Invalid webhook signature");
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 }
            );
        }

        const event = JSON.parse(body);
        const eventType = event.event;

        console.log("Razorpay webhook received:", eventType);

        switch (eventType) {
            case "subscription.activated":
                await handleSubscriptionActivated(event.payload.subscription.entity);
                break;

            case "subscription.charged":
                await handleSubscriptionCharged(event.payload.subscription.entity, event.payload.payment.entity);
                break;

            case "subscription.cancelled":
                await handleSubscriptionCancelled(event.payload.subscription.entity);
                break;

            case "subscription.halted":
            case "subscription.pending":
                await handleSubscriptionHalted(event.payload.subscription.entity);
                break;

            case "payment.captured":
                // Payment captured - handled by subscription.charged for recurring
                // For one-time payments, this is handled client-side
                console.log("Payment captured:", event.payload.payment.entity.id);
                break;

            case "payment.failed":
                console.log("Payment failed:", event.payload.payment.entity.id);
                break;

            default:
                console.log("Unhandled webhook event:", eventType);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: error.message || "Webhook processing failed" },
            { status: 500 }
        );
    }
}

async function handleSubscriptionActivated(subscriptionEntity: any) {
    const { id, customer_id, notes } = subscriptionEntity;
    const userId = notes?.userId;

    if (!userId) {
        console.error("No userId in subscription notes");
        return;
    }

    try {
        await db.subscription.update({
            where: { userId },
            data: {
                razorpaySubscriptionId: id,
                razorpayCustomerId: customer_id,
                status: SubscriptionStatus.ACTIVE,
            },
        });
        console.log("Subscription activated for user:", userId);
    } catch (error) {
        console.error("Failed to activate subscription:", error);
    }
}

async function handleSubscriptionCharged(subscriptionEntity: any, paymentEntity: any) {
    const { id, customer_id, notes, current_start, current_end } = subscriptionEntity;
    const userId = notes?.userId;

    if (!userId) {
        console.error("No userId in subscription notes");
        return;
    }

    try {
        // Update subscription period
        const subscription = await db.subscription.update({
            where: { userId },
            data: {
                razorpaySubscriptionId: id,
                razorpayCustomerId: customer_id,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: new Date(current_start * 1000),
                currentPeriodEnd: new Date(current_end * 1000),
            },
        });

        // Record payment
        if (paymentEntity) {
            await db.payment.create({
                data: {
                    subscriptionId: subscription.id,
                    amount: paymentEntity.amount,
                    currency: paymentEntity.currency || "INR",
                    status: "captured",
                    razorpayPaymentId: paymentEntity.id,
                    razorpayOrderId: paymentEntity.order_id,
                },
            });
        }

        console.log("Subscription charged for user:", userId);
    } catch (error) {
        console.error("Failed to handle subscription charge:", error);
    }
}

async function handleSubscriptionCancelled(subscriptionEntity: any) {
    const { notes, ended_at } = subscriptionEntity;
    const userId = notes?.userId;

    if (!userId) {
        console.error("No userId in subscription notes");
        return;
    }

    try {
        // Get free plan
        const freePlan = await db.subscriptionPlan.findUnique({
            where: { tier: PlanTier.FREE },
        });

        if (!freePlan) {
            console.error("Free plan not found");
            return;
        }

        await db.subscription.update({
            where: { userId },
            data: {
                status: SubscriptionStatus.CANCELLED,
                cancelledAt: new Date(),
                // Don't downgrade immediately - wait until period ends
            },
        });

        console.log("Subscription cancelled for user:", userId);
    } catch (error) {
        console.error("Failed to handle subscription cancellation:", error);
    }
}

async function handleSubscriptionHalted(subscriptionEntity: any) {
    const { notes } = subscriptionEntity;
    const userId = notes?.userId;

    if (!userId) {
        console.error("No userId in subscription notes");
        return;
    }

    try {
        await db.subscription.update({
            where: { userId },
            data: {
                status: SubscriptionStatus.PAST_DUE,
            },
        });

        console.log("Subscription halted for user:", userId);
    } catch (error) {
        console.error("Failed to handle subscription halt:", error);
    }
}

// Handle GET for testing
export async function GET() {
    return NextResponse.json({ message: "Razorpay webhook endpoint is active" });
}

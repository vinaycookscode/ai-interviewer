import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { Prisma, SubscriptionStatus } from "@prisma/client";

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
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}

// Handlers let database errors propagate: the route then answers 500 and Razorpay
// retries the event. Conditions a retry can't fix are logged and acknowledged.

/** Update the user's subscription; logs and skips when there is no row to update. */
async function updateSubscription(userId: string, data: Prisma.SubscriptionUpdateManyMutationInput, event: string) {
    const { count } = await db.subscription.updateMany({ where: { userId }, data });
    if (count === 0) {
        console.error(`${event}: no subscription row for user ${userId}`);
    }
    return count > 0;
}

async function handleSubscriptionActivated(subscriptionEntity: any) {
    const { id, customer_id, notes } = subscriptionEntity;
    const userId = notes?.userId;

    if (!userId) {
        console.error("No userId in subscription notes");
        return;
    }

    if (await updateSubscription(userId, {
        razorpaySubscriptionId: id,
        razorpayCustomerId: customer_id,
        status: SubscriptionStatus.ACTIVE,
    }, "subscription.activated")) {
        console.log("Subscription activated for user:", userId);
    }
}

async function handleSubscriptionCharged(subscriptionEntity: any, paymentEntity: any) {
    const { id, customer_id, notes, current_start, current_end } = subscriptionEntity;
    const userId = notes?.userId;

    if (!userId) {
        console.error("No userId in subscription notes");
        return;
    }

    const updated = await updateSubscription(userId, {
        razorpaySubscriptionId: id,
        razorpayCustomerId: customer_id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(current_start * 1000),
        currentPeriodEnd: new Date(current_end * 1000),
    }, "subscription.charged");

    if (!updated || !paymentEntity) return;

    const subscription = await db.subscription.findUniqueOrThrow({ where: { userId }, select: { id: true } });

    // Razorpay redelivers events; record each payment once.
    await db.payment.upsert({
        where: { razorpayPaymentId: paymentEntity.id },
        update: {},
        create: {
            subscriptionId: subscription.id,
            amount: paymentEntity.amount,
            currency: paymentEntity.currency || "INR",
            status: "captured",
            razorpayPaymentId: paymentEntity.id,
            razorpayOrderId: paymentEntity.order_id,
        },
    });

    console.log("Subscription charged for user:", userId);
}

async function handleSubscriptionCancelled(subscriptionEntity: any) {
    const userId = subscriptionEntity.notes?.userId;

    if (!userId) {
        console.error("No userId in subscription notes");
        return;
    }

    // Don't downgrade immediately - access lasts until the period ends
    if (await updateSubscription(userId, {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
    }, "subscription.cancelled")) {
        console.log("Subscription cancelled for user:", userId);
    }
}

async function handleSubscriptionHalted(subscriptionEntity: any) {
    const userId = subscriptionEntity.notes?.userId;

    if (!userId) {
        console.error("No userId in subscription notes");
        return;
    }

    if (await updateSubscription(userId, { status: SubscriptionStatus.PAST_DUE }, "subscription.halted")) {
        console.log("Subscription halted for user:", userId);
    }
}

import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCurrentSubscription } from "@/actions/subscription";
import { getUsageStats } from "@/lib/usage";
import { SubscriptionDetails } from "@/components/subscription/subscription-details";

export const metadata: Metadata = {
    title: "Subscription | AI Interviewer",
    description: "Manage your subscription and view usage statistics",
};

export default async function SubscriptionPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/login");
    }

    const [subscription, usageStats] = await Promise.all([
        getCurrentSubscription(),
        getUsageStats(),
    ]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your subscription and view your usage statistics.
                </p>
            </div>

            <SubscriptionDetails
                subscription={subscription}
                usageStats={usageStats}
            />
        </div>
    );
}

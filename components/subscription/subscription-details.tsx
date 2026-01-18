"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Zap, Sparkles, Calendar, CreditCard, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PlanTier, SubscriptionStatus, BillingPeriod } from "@prisma/client";
import { cancelSubscription } from "@/actions/subscription";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { toRupees } from "@/lib/razorpay";

interface UsageFeature {
    featureType: string;
    displayName: string;
    currentUsage: number;
    limit: number;
    remaining: number;
    percentUsed: number;
}

interface SubscriptionDetailsProps {
    subscription: any;
    usageStats: {
        features: UsageFeature[];
        plan: {
            name: string;
            tier: PlanTier;
        };
    };
}

const tierIcons = {
    FREE: Sparkles,
    PRO: Zap,
    PREMIUM: Crown,
};

const tierColors = {
    FREE: "from-gray-500 to-gray-600",
    PRO: "from-blue-500 to-indigo-600",
    PREMIUM: "from-purple-500 to-pink-600",
};

const statusColors = {
    ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    CANCELLED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    EXPIRED: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    PAST_DUE: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    TRIALING: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

export function SubscriptionDetails({ subscription, usageStats }: SubscriptionDetailsProps) {
    const [isCancelling, setIsCancelling] = useState(false);
    const router = useRouter();

    const plan = subscription?.plan;
    const tierKey = (plan?.tier || "FREE") as keyof typeof tierIcons;
    const statusKey = (subscription?.status || "ACTIVE") as keyof typeof statusColors;
    const Icon = tierIcons[tierKey];
    const isFree = subscription?.isFree || plan?.tier === PlanTier.FREE;

    const handleCancelSubscription = async () => {
        setIsCancelling(true);
        try {
            const result = await cancelSubscription();
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error || "Failed to cancel subscription");
            }
        } catch (error) {
            toast.error("Failed to cancel subscription");
        }
        setIsCancelling(false);
    };

    return (
        <div className="space-y-6">
            {/* Current Plan Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "rounded-full p-2 bg-gradient-to-br text-white",
                                tierColors[tierKey]
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <CardTitle>{plan?.name || "Free"} Plan</CardTitle>
                                <CardDescription>
                                    {isFree ? "You're on the free plan" : `₹${plan?.monthlyPriceDisplay}/month`}
                                </CardDescription>
                            </div>
                        </div>
                        <Badge className={statusColors[statusKey]}>
                            {subscription?.status || "ACTIVE"}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {!isFree && (
                        <>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {subscription?.billingPeriod === BillingPeriod.YEARLY ? "Yearly" : "Monthly"} billing
                                    </span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        Renews {new Date(subscription?.currentPeriodEnd).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {subscription?.status === SubscriptionStatus.CANCELLED && (
                                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>
                                        Your subscription is cancelled. Access continues until {new Date(subscription?.currentPeriodEnd).toLocaleDateString()}.
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex gap-3">
                    {isFree ? (
                        <Button asChild>
                            <Link href="/candidate/pricing">
                                Upgrade Plan
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" asChild>
                                <Link href="/candidate/pricing">
                                    Change Plan
                                </Link>
                            </Button>
                            {subscription?.status === SubscriptionStatus.ACTIVE && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" className="text-destructive hover:text-destructive">
                                            Cancel Subscription
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Your subscription will be cancelled at the end of the current billing period
                                                ({new Date(subscription?.currentPeriodEnd).toLocaleDateString()}).
                                                You'll continue to have access until then.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleCancelSubscription}
                                                disabled={isCancelling}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                {isCancelling ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    "Yes, Cancel"
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </>
                    )}
                </CardFooter>
            </Card>

            {/* Usage Statistics */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage This Month</CardTitle>
                    <CardDescription>
                        Your AI feature usage resets on the 1st of each month
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {usageStats.features.map((feature) => (
                        <div key={feature.featureType} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{feature.displayName}</span>
                                <span className="text-muted-foreground">
                                    {feature.limit === -1
                                        ? `${feature.currentUsage} used (Unlimited)`
                                        : feature.limit === 0
                                            ? "Not available"
                                            : `${feature.currentUsage} / ${feature.limit}`
                                    }
                                </span>
                            </div>
                            <Progress
                                value={feature.limit === -1 ? 0 : Math.min(feature.percentUsed, 100)}
                                className={cn(
                                    "h-2",
                                    feature.percentUsed >= 100 && "bg-red-200",
                                    feature.limit === 0 && "opacity-30"
                                )}
                            />
                            {feature.percentUsed >= 80 && feature.percentUsed < 100 && feature.limit > 0 && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                    You're running low on {feature.displayName.toLowerCase()}
                                </p>
                            )}
                            {feature.percentUsed >= 100 && feature.limit > 0 && (
                                <p className="text-xs text-red-600 dark:text-red-400">
                                    You've reached your limit. <Link href="/candidate/pricing" className="underline">Upgrade</Link> for more.
                                </p>
                            )}
                        </div>
                    ))}
                </CardContent>
                {isFree && (
                    <CardFooter className="bg-muted/50">
                        <div className="flex items-center justify-between w-full">
                            <p className="text-sm text-muted-foreground">
                                Need more? Upgrade to Pro or Premium for higher limits.
                            </p>
                            <Button size="sm" asChild>
                                <Link href="/candidate/pricing">
                                    View Plans
                                </Link>
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>

            {/* Payment History */}
            {!isFree && subscription?.payments?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {subscription.payments.map((payment: any) => (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between py-2 border-b last:border-0"
                                >
                                    <div>
                                        <p className="font-medium">₹{toRupees(payment.amount)}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(payment.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={payment.status === "captured" ? "default" : "destructive"}
                                    >
                                        {payment.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

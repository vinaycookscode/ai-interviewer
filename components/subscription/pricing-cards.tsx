"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Check, X, Loader2, Sparkles, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BillingPeriod, PlanTier } from "@prisma/client";
import { createSubscriptionOrder, verifyAndActivateSubscription } from "@/actions/subscription";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { decryptData } from "@/lib/encryption";
import { useTranslations } from "next-intl";

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface Plan {
    id: string;
    name: string;
    tier: PlanTier;
    monthlyPrice: number;
    yearlyPrice: number;
    monthlyPriceDisplay: number;
    yearlyPriceDisplay: number;
    yearlySavings: number;
    mockInterviewLimit: number;
    resumeAnalysisLimit: number;
    questionGenerationLimit: number;
    coverLetterLimit: number;
    resumeRewriteLimit: number;
    aiEvaluationEnabled: boolean;
    prioritySupport: boolean;
}

interface PricingCardsProps {
    plans: Plan[];
    currentPlanTier?: PlanTier;
    razorpayKeyId: string;
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

/**
 * Isolated component to handle search parameter reading safely within a Suspense boundary.
 * This satisfies Next.js requirement during static builds.
 */
function SearchParamsHandler({ onParams }: { onParams: (params: URLSearchParams) => void }) {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams) {
            onParams(searchParams);
        }
    }, [searchParams, onParams]);

    return null;
}

export function PricingCards({ plans, currentPlanTier, razorpayKeyId }: PricingCardsProps) {
    const t = useTranslations("Pricing");
    const tCommon = useTranslations("Common");
    const tSub = useTranslations("Subscription");
    const [isYearly, setIsYearly] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const router = useRouter();
    const hasTriggeredRef = useRef(false);

    function formatLimit(limit: number): string {
        if (limit === -1) return tCommon("unlimited");
        if (limit === 0) return "—";
        return limit.toString();
    }

    const handleSubscribe = async (plan: Plan, overrideYearly?: boolean) => {
        if (plan.tier === PlanTier.FREE) {
            toast.info(tSub("toast.alreadyFree"));
            return;
        }

        if (plan.tier === currentPlanTier) {
            toast.info(tSub("toast.alreadyCurrent"));
            return;
        }

        setLoadingPlan(plan.id);

        try {
            const isYearlyBilling = overrideYearly !== undefined ? overrideYearly : isYearly;
            const billingPeriod = isYearlyBilling ? BillingPeriod.YEARLY : BillingPeriod.MONTHLY;
            const result = await createSubscriptionOrder(plan.tier, billingPeriod);

            if (!result.success) {
                toast.error(result.error || tSub("toast.orderFailed"));
                setLoadingPlan(null);
                return;
            }

            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                const script = document.createElement("script");
                script.src = "https://checkout.razorpay.com/v1/checkout.js";
                script.async = true;
                document.body.appendChild(script);
                await new Promise((resolve) => {
                    script.onload = resolve;
                });
            }

            const options = {
                key: razorpayKeyId,
                amount: result.amount,
                currency: result.currency,
                name: "AI Interviewer",
                description: `${plan.name} Plan - ${isYearly ? t("yearly") : t("monthly")}`,
                order_id: result.orderId,
                prefill: result.prefill,
                theme: {
                    color: "#6366f1",
                },
                handler: async function (response: any) {
                    try {
                        const verifyResult = await verifyAndActivateSubscription(
                            response.razorpay_order_id,
                            response.razorpay_payment_id,
                            response.razorpay_signature,
                            result.planId!,
                            billingPeriod
                        );

                        if (verifyResult.success) {
                            toast.success(verifyResult.message);
                            router.refresh();
                            router.push("/candidate/settings/subscription");
                        } else {
                            toast.error(verifyResult.error || tSub("toast.verifyFailed"));
                        }
                    } catch (error) {
                        toast.error(tSub("toast.verifyError"));
                    }
                    setLoadingPlan(null);
                },
                modal: {
                    ondismiss: function () {
                        setLoadingPlan(null);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            toast.error(tSub("toast.initError"));
            setLoadingPlan(null);
        }
    };

    const handleParamsSync = (params: URLSearchParams) => {
        const s = params.get("s");
        const decrypted = s ? decryptData(s) : null;

        const selectedPlanTier = decrypted?.plan || params.get("selected");
        const selectedPeriod = decrypted?.period || params.get("period");

        if (selectedPeriod === "YEARLY") {
            setIsYearly(true);
        } else if (selectedPeriod === "MONTHLY") {
            setIsYearly(false);
        }

        if (selectedPlanTier && !hasTriggeredRef.current && plans.length > 0) {
            const planToSelect = plans.find(p => p.tier === selectedPlanTier);
            if (planToSelect && planToSelect.tier !== currentPlanTier) {
                hasTriggeredRef.current = true;
                handleSubscribe(planToSelect, selectedPeriod === "YEARLY" || (selectedPeriod === null && isYearly));
            }
        }
    };

    return (
        <div className="space-y-8">
            <Suspense fallback={null}>
                <SearchParamsHandler onParams={handleParamsSync} />
            </Suspense>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
                <Label htmlFor="billing-toggle" className={cn(!isYearly && "font-semibold")}>
                    {t("monthly")}
                </Label>
                <Switch
                    id="billing-toggle"
                    checked={isYearly}
                    onCheckedChange={setIsYearly}
                />
                <Label htmlFor="billing-toggle" className={cn(isYearly && "font-semibold")}>
                    {t("yearly")}
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        {t("save", { percent: 17 })}
                    </Badge>
                </Label>
            </div>

            {/* Pricing Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => {
                    const Icon = tierIcons[plan.tier];
                    const isCurrentPlan = plan.tier === currentPlanTier;
                    const isMostPopular = plan.tier === PlanTier.PRO;
                    const price = isYearly ? plan.yearlyPriceDisplay : plan.monthlyPriceDisplay;

                    return (
                        <Card
                            key={plan.id}
                            className={cn(
                                "relative flex flex-col transition-all duration-300 hover:shadow-lg",
                                isMostPopular && "border-2 border-primary shadow-lg scale-105",
                                isCurrentPlan && "ring-2 ring-primary"
                            )}
                        >
                            {isMostPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600">
                                        {t("popular")}
                                    </Badge>
                                </div>
                            )}

                            {isCurrentPlan && (
                                <div className="absolute -top-3 right-4">
                                    <Badge variant="outline" className="bg-background">
                                        {t("currentPlan")}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="text-center pb-2">
                                <div className={cn(
                                    "mx-auto rounded-full p-3 bg-gradient-to-br text-white mb-4",
                                    tierColors[plan.tier]
                                )}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>
                                    {plan.tier === PlanTier.FREE && t("plans.free.description")}
                                    {plan.tier === PlanTier.PRO && t("plans.pro.description")}
                                    {plan.tier === PlanTier.PREMIUM && t("plans.premium.description")}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                {/* Price */}
                                <div className="text-center mb-6">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold">
                                            ₹{price}
                                        </span>
                                        {plan.tier !== PlanTier.FREE && (
                                            <span className="text-muted-foreground">
                                                /{isYearly ? t("perYear") : t("perMonth")}
                                            </span>
                                        )}
                                    </div>
                                    {isYearly && plan.yearlySavings > 0 && (
                                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                                            {t("saveAmount", { amount: plan.yearlySavings })}
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3">
                                    <FeatureItem
                                        included={true}
                                        label={tSub("features.mockInterviews", { limit: formatLimit(plan.mockInterviewLimit) })}
                                    />
                                    <FeatureItem
                                        included={true}
                                        label={tSub("features.resumeAnalysis", { limit: formatLimit(plan.resumeAnalysisLimit) })}
                                    />
                                    <FeatureItem
                                        included={true}
                                        label={tSub("features.questionGen", { limit: formatLimit(plan.questionGenerationLimit) })}
                                    />
                                    <FeatureItem
                                        included={plan.coverLetterLimit !== 0}
                                        label={tSub("features.coverLetters", { limit: formatLimit(plan.coverLetterLimit) })}
                                    />
                                    <FeatureItem
                                        included={plan.resumeRewriteLimit !== 0}
                                        label={tSub("features.resumeRewrites", { limit: formatLimit(plan.resumeRewriteLimit) })}
                                    />
                                    <FeatureItem
                                        included={plan.aiEvaluationEnabled}
                                        label={tSub("features.aiEvaluation")}
                                    />
                                    <FeatureItem
                                        included={plan.prioritySupport}
                                        label={tSub("features.prioritySupport")}
                                    />
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className={cn(
                                        "w-full",
                                        plan.tier === PlanTier.PREMIUM && "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                                    )}
                                    variant={plan.tier === PlanTier.FREE ? "outline" : "default"}
                                    disabled={isCurrentPlan || loadingPlan !== null}
                                    onClick={() => handleSubscribe(plan)}
                                >
                                    {loadingPlan === plan.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {tCommon("processing")}
                                        </>
                                    ) : isCurrentPlan ? (
                                        t("currentPlan")
                                    ) : plan.tier === PlanTier.FREE ? (
                                        t("startFree")
                                    ) : (
                                        t("upgradeTo", { name: plan.name })
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

function FeatureItem({ included, label }: { included: boolean; label: string }) {
    return (
        <li className="flex items-center gap-2">
            {included ? (
                <Check className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
                <X className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={cn("text-sm", !included && "text-muted-foreground")}>
                {label}
            </span>
        </li>
    );
}

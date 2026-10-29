"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";
import { BillingPeriod, PlanTier } from "@prisma/client";
import { createSubscriptionOrder, verifyAndActivateSubscription } from "@/actions/subscription";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { readPlanSelection } from "@/lib/plan-selection";
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
        const { plan: selectedPlanTier, period: selectedPeriod } = readPlanSelection(params);

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

    const tLanding = useTranslations("Landing.pricing");
    const KEYS: Record<PlanTier, "free" | "pro" | "premium"> = { FREE: "free", PRO: "pro", PREMIUM: "premium" };
    const periodButton = (active: boolean) =>
        cn("h-10 rounded-full px-4 text-sm font-bold transition-colors", focusRing, active ? "bg-sg-ink text-sg-ink-foreground" : "text-sg-muted hover:text-sg-text");

    return (
        <div className="flex flex-col gap-8">
            <Suspense fallback={null}>
                <SearchParamsHandler onParams={handleParamsSync} />
            </Suspense>

            <div role="group" aria-label={tLanding("periodLabel")} className="sg-glass inline-flex gap-1 self-start rounded-full p-1">
                <button type="button" aria-pressed={!isYearly} onClick={() => setIsYearly(false)} className={periodButton(!isYearly)}>
                    {tLanding("monthly")}
                </button>
                <button type="button" aria-pressed={isYearly} onClick={() => setIsYearly(true)} className={periodButton(isYearly)}>
                    {tLanding("yearly")}
                </button>
            </div>

            <ul className="grid gap-5 lg:grid-cols-3">
                {plans.map((plan) => {
                    const key = KEYS[plan.tier];
                    const isCurrentPlan = plan.tier === currentPlanTier;
                    const featured = plan.tier === PlanTier.PRO;
                    const free = plan.tier === PlanTier.FREE;
                    const price = isYearly ? plan.yearlyPriceDisplay : plan.monthlyPriceDisplay;
                    const features = tLanding.raw(`plans.${key}.features`) as string[];

                    return (
                        <li
                            key={plan.id}
                            className={cn(
                                "flex flex-col gap-5 rounded-[24px] p-6 sm:rounded-[28px] sm:p-7",
                                featured ? "sg-shadow-lg bg-sg-ink text-sg-ink-foreground" : "sg-glass"
                            )}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-xl font-bold">{tLanding(`plans.${key}.name`)}</h2>
                                <span className="flex gap-1.5">
                                    {featured && (
                                        <span className="rounded-full bg-sg-coral px-3 py-1 text-[13px] font-bold text-sg-coral-ink">{tLanding("popular")}</span>
                                    )}
                                    {isCurrentPlan && (
                                        <span className={cn("rounded-full px-3 py-1 text-[13px] font-bold", featured ? "bg-sg-ink-foreground/15" : "bg-sg-chip")}>
                                            {t("yourPlan")}
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display text-5xl font-semibold tracking-[-0.03em]">₹{price}</span>
                                <span className={cn("font-medium", featured ? "opacity-80" : "text-sg-muted")}>
                                    {free ? tLanding("forever") : isYearly ? tLanding("perYear") : tLanding("perMonth")}
                                </span>
                            </div>
                            <p className={cn("font-medium", featured ? "opacity-80" : "text-sg-muted")}>{tLanding(`plans.${key}.tagline`)}</p>
                            <ul className="flex flex-col gap-2.5">
                                {features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2.5">
                                        <Check className="mt-0.5 size-[18px] shrink-0" strokeWidth={2.6} aria-hidden="true" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            {isCurrentPlan ? (
                                <p className={cn("mt-auto flex h-12 items-center justify-center rounded-full font-bold", featured ? "bg-sg-ink-foreground/10" : "bg-sg-chip")}>
                                    {t("currentPlan")}
                                </p>
                            ) : free ? (
                                <p className={cn("mt-auto text-center text-sm font-medium", featured ? "opacity-80" : "text-sg-muted")}>{t("freeIncluded")}</p>
                            ) : (
                                <button
                                    type="button"
                                    disabled={loadingPlan !== null}
                                    onClick={() => handleSubscribe(plan)}
                                    className={cn(
                                        "mt-auto flex h-12 items-center justify-center gap-2 rounded-full font-bold transition-opacity hover:opacity-90 disabled:opacity-60",
                                        focusRing,
                                        featured ? "bg-sg-coral text-sg-coral-ink" : "border border-sg-glass-border bg-sg-row text-sg-text"
                                    )}
                                >
                                    {loadingPlan === plan.id && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                    {loadingPlan === plan.id ? tCommon("processing") : tLanding(`plans.${key}.cta`)}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

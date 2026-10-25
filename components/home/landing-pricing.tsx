"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { planSelectionQuery } from "@/lib/plan-selection";
import { cn } from "@/lib/utils";
import { focusRing } from "@/components/soft-glass/classes";

const PLANS = [
    { key: "free", tier: "FREE", monthly: "₹0", yearly: "₹0" },
    { key: "pro", tier: "PRO", monthly: "₹249", yearly: "₹2,490", popular: true },
    { key: "premium", tier: "PREMIUM", monthly: "₹499", yearly: "₹4,990" },
] as const;

export function LandingPricing() {
    const t = useTranslations("Landing.pricing");
    const [yearly, setYearly] = useState(false);
    const period = yearly ? "YEARLY" : "MONTHLY";

    const periodButton = (active: boolean) =>
        cn(
            "h-10 rounded-full px-4 text-sm font-bold transition-colors",
            focusRing,
            active ? "bg-sg-ink text-sg-ink-foreground" : "text-sg-muted hover:text-sg-text"
        );

    return (
        <section id="pricing" aria-labelledby="pricing-title" className="flex scroll-mt-24 flex-col gap-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 id="pricing-title" className="font-display sg-soft text-[32px] font-semibold leading-[38px] tracking-[-0.025em] sm:text-[44px] sm:leading-[50px]">
                    {t("title")}
                </h2>
                <div role="group" aria-label={t("periodLabel")} className="sg-glass inline-flex gap-1 rounded-full p-1">
                    <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)} className={periodButton(!yearly)}>
                        {t("monthly")}
                    </button>
                    <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)} className={periodButton(yearly)}>
                        {t("yearly")}
                    </button>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                {PLANS.map((plan) => {
                    const featured = "popular" in plan && plan.popular;
                    const free = plan.tier === "FREE";
                    const features = t.raw(`plans.${plan.key}.features`) as string[];
                    const href = free ? "/auth/register" : `/auth/register?${planSelectionQuery(plan.tier, period)}`;

                    return (
                        <article
                            key={plan.key}
                            className={cn(
                                "flex flex-col gap-5 rounded-[24px] p-6 sm:rounded-[28px] sm:p-7",
                                featured ? "sg-shadow-lg bg-sg-ink text-sg-ink-foreground" : "sg-glass"
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-xl font-bold">{t(`plans.${plan.key}.name`)}</h3>
                                {featured && (
                                    <span className="rounded-full bg-sg-coral px-3 py-1 text-[13px] font-bold text-sg-coral-ink">
                                        {t("popular")}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="font-display text-5xl font-semibold tracking-[-0.03em]">
                                    {yearly ? plan.yearly : plan.monthly}
                                </span>
                                <span className={cn("font-medium", featured ? "opacity-80" : "text-sg-muted")}>
                                    {free ? t("forever") : yearly ? t("perYear") : t("perMonth")}
                                </span>
                            </div>
                            <p className={cn("font-medium", featured ? "opacity-80" : "text-sg-muted")}>
                                {t(`plans.${plan.key}.tagline`)}
                            </p>
                            <ul className="flex flex-col gap-2.5">
                                {features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2.5">
                                        <Check className="mt-0.5 size-[18px] shrink-0" strokeWidth={2.6} aria-hidden="true" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={href}
                                className={cn(
                                    "mt-auto flex h-12 items-center justify-center rounded-full font-bold transition-opacity hover:opacity-90",
                                    focusRing,
                                    featured ? "bg-sg-coral text-sg-coral-ink" : "border border-sg-glass-border bg-sg-row text-sg-text"
                                )}
                            >
                                {t(`plans.${plan.key}.cta`)}
                            </Link>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

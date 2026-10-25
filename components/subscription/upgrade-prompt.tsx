import Link from "next/link";
import { ArrowRight, Crown, Lock, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Mascot } from "@/components/soft-glass/mascot";
import { coralButton } from "@/components/soft-glass/classes";
import { cn } from "@/lib/utils";

interface UpgradePromptProps {
    feature: string;
    description?: string;
}

/** Shown in place of a paid feature on the free plan. Renders inside the Soft Glass app shell. */
export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
    const t = useTranslations("Subscription.prompt");
    const tPricing = useTranslations("Pricing");

    const featureDescriptions: Record<string, string> = {
        "AI Practice": t("features.aiPractice"),
        "Resume Screener": t("features.resumeScreener"),
        "AI Question Generation": t("features.questionGen"),
    };

    const featureDesc = description || featureDescriptions[feature] || t("unlock", { feature });
    const plans = [
        { icon: Zap, name: tPricing("plans.pro.name"), price: tPricing("plans.pro.priceMonthly"), detail: t("proFeatures") },
        { icon: Crown, name: tPricing("plans.premium.name"), price: tPricing("plans.premium.priceMonthly"), detail: t("premiumFeatures") },
    ];

    return (
        <div className="flex flex-1 items-center justify-center py-6">
            <section className="sg-glass sg-shadow-lg flex w-full max-w-xl flex-col gap-5 rounded-[24px] p-6 sm:rounded-[32px] sm:p-10">
                <div className="flex items-center gap-3.5">
                    <Mascot className="size-14" />
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-sg-chip px-3 text-sm font-semibold">
                        <Lock className="size-3.5" aria-hidden="true" />
                        {tPricing("plans.pro.name")}
                    </span>
                </div>
                <div className="flex flex-col gap-2">
                    <h1 className="sg-soft font-display text-[26px] font-semibold leading-[33px] tracking-[-0.015em]">{t("upgradeToPro")}</h1>
                    <p className="text-base leading-6 text-sg-muted">{featureDesc}</p>
                </div>
                <ul className="flex flex-col gap-2">
                    {plans.map(({ icon: Icon, name, price, detail }) => (
                        <li key={name} className="flex items-center gap-3 rounded-[18px] bg-sg-row p-3.5">
                            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-sg-chip" aria-hidden="true">
                                <Icon className="size-[18px]" />
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <span className="font-semibold">{t("planSummary", { name, price })}</span>
                                <span className="text-[13px] font-medium leading-[18px] text-sg-muted">{detail}</span>
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                    <Link href="/candidate/pricing" className={cn(coralButton, "h-14 whitespace-nowrap px-7 text-[17px]")}>
                        {t("upgradeNow")}
                        <ArrowRight className="size-[18px]" aria-hidden="true" />
                    </Link>
                    <span className="text-sm text-sg-muted">{t("policy")}</span>
                </div>
            </section>
        </div>
    );
}

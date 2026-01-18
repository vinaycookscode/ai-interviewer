"use client";

import { useRouter } from "next/navigation";
import { Crown, Zap, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface UpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    feature: string;
    currentUsage?: number;
    limit?: number;
}

export function UpgradeModal({ open, onOpenChange, feature, currentUsage, limit }: UpgradeModalProps) {
    const t = useTranslations("Subscription.upgrade");
    const tPricing = useTranslations("Pricing");
    const router = useRouter();

    const info = {
        title: t(`featureInfo.${feature}.title`),
        description: t(`featureInfo.${feature}.description`)
    };

    const handleUpgrade = () => {
        onOpenChange(false);
        router.push("/candidate/pricing");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto rounded-full p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-4 w-fit">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl">{t("title")}</DialogTitle>
                    <DialogDescription className="text-base">
                        {t("description", { limit: limit ?? 0, feature: info.title.toLowerCase() })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="text-center text-sm text-muted-foreground">
                        {info.description}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <PlanPreview
                            name={tPricing("plans.pro.name")}
                            icon={Zap}
                            price={tPricing("plans.pro.priceMonthly")}
                            gradient="from-blue-500 to-indigo-600"
                            features={[
                                tPricing("plans.pro.features.0"),
                                tPricing("plans.pro.features.1"),
                                t("allFeatures")
                            ]}
                        />
                        <PlanPreview
                            name={tPricing("plans.premium.name")}
                            icon={Crown}
                            price={tPricing("plans.premium.priceMonthly")}
                            gradient="from-purple-500 to-pink-600"
                            features={[
                                t("unlimitedEverything"),
                                tPricing("plans.premium.features.3"),
                                t("allFeatures")
                            ]}
                            recommended
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                        {t("viewOptions")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
                        {t("maybeLater")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PlanPreview({
    name,
    icon: Icon,
    price,
    gradient,
    features,
    recommended
}: {
    name: string;
    icon: any;
    price: string;
    gradient: string;
    features: string[];
    recommended?: boolean;
}) {
    const t = useTranslations("Subscription.upgrade");
    const tPricing = useTranslations("Pricing");
    return (
        <div className={cn(
            "relative rounded-lg border p-4 text-center",
            recommended && "border-2 border-purple-500"
        )}>
            {recommended && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {t("bestValue")}
                    </span>
                </div>
            )}
            <div className={cn(
                "mx-auto rounded-full p-2 bg-gradient-to-br text-white w-fit mb-2",
                gradient
            )}>
                <Icon className="h-4 w-4" />
            </div>
            <p className="font-semibold">{name}</p>
            <p className="text-lg font-bold">{price}<span className="text-xs font-normal text-muted-foreground">/{tPricing("perMonth")}</span></p>
            <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                {features.map((f, i) => (
                    <li key={i}>{f}</li>
                ))}
            </ul>
        </div>
    );
}

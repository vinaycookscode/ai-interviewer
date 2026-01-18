import Link from "next/link";
import { Crown, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface UpgradePromptProps {
    feature: string;
    description?: string;
}

export function UpgradePrompt({ feature, description }: UpgradePromptProps) {
    const t = useTranslations("Subscription.prompt");
    const tPricing = useTranslations("Pricing");

    const featureDescriptions: Record<string, string> = {
        "AI Practice": t("features.aiPractice"),
        "Resume Screener": t("features.resumeScreener"),
        "AI Question Generation": t("features.questionGen"),
    };

    const featureDesc = description || featureDescriptions[feature] || t("unlock", { feature });

    return (
        <div className="flex h-full items-center justify-center p-6">
            <Card className="max-w-lg text-center">
                <CardHeader className="pb-4">
                    <div className="mx-auto rounded-full p-4 bg-gradient-to-br from-yellow-400 to-orange-500 text-white mb-4 w-fit">
                        <Crown className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl">{t("upgradeToPro")}</CardTitle>
                    <CardDescription className="text-base mt-2">
                        {featureDesc}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Benefits */}
                    <div className="grid gap-3 text-left">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="rounded-full p-2 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                                <Zap className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">
                                    {t("planSummary", { name: tPricing("plans.pro.name"), price: tPricing("plans.pro.priceMonthly") })}
                                </p>
                                <p className="text-xs text-muted-foreground">{t("proFeatures")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="rounded-full p-2 bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                                <Crown className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">
                                    {t("planSummary", { name: tPricing("plans.premium.name"), price: tPricing("plans.premium.priceMonthly") })}
                                </p>
                                <p className="text-xs text-muted-foreground">{t("premiumFeatures")}</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <Button asChild size="lg" className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                        <Link href="/candidate/pricing">
                            <Sparkles className="mr-2 h-4 w-4" />
                            {t("upgradeNow")}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        {t("policy")}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

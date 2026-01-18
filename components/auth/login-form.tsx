"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { login } from "@/actions/auth";
import { Loader2, Crown, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

import { decryptData, encryptData } from "@/lib/encryption";

import { useTranslations } from "next-intl";

export const LoginForm = () => {
    const t = useTranslations("Auth.login");
    const tCommon = useTranslations("Common");
    const tPricing = useTranslations("Pricing");
    const searchParams = useSearchParams();
    const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
        ? t("errors.oauthAccountNotLinked")
        : "";

    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();

    const router = useRouter();
    const pathname = usePathname();

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Decode encrypted state if present
    const s = searchParams.get("s");
    const decrypted = s ? decryptData(s) : null;

    const selectedPlan = decrypted?.plan || searchParams.get("plan") || "FREE";
    const selectedPeriod = decrypted?.period || searchParams.get("period") || "MONTHLY";
    const isYearly = selectedPeriod === "YEARLY";

    const setPlan = (plan: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const encrypted = encryptData({ plan, period: selectedPeriod });
        params.set("s", encrypted);
        params.delete("plan");
        params.delete("period");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const setPeriod = (period: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const encrypted = encryptData({ plan: selectedPlan, period });
        params.set("s", encrypted);
        params.delete("plan");
        params.delete("period");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        setSuccess("");

        let callbackUrl = searchParams.get("callbackUrl") || undefined;

        // If plan was selected on homepage, redirect to pricing after auth
        if (!callbackUrl && selectedPlan && selectedPlan !== "FREE") {
            const encrypted = encryptData({ plan: selectedPlan, period: selectedPeriod });
            callbackUrl = `/candidate/pricing?s=${encrypted}`;
        }

        startTransition(() => {
            login(values, callbackUrl)
                .then((data) => {
                    if (data?.error) {
                        form.reset();
                        setError(data.error);
                    }
                    // Success is handled by redirect in server action
                })
                .catch(() => setError(t("errors.generic")));
        });
    };

    return (
        <CardWrapper
            headerLabel={t("title")}
            backButtonLabel={t("noAccount")}
            backButtonHref="/auth/register"
        >
            <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-medium text-muted-foreground">{t("subtitle")}</p>
                    <div className="flex items-center gap-2 scale-75 origin-right">
                        <span className={`text-xs ${!isYearly ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                            {tPricing("monthly")}
                        </span>
                        <Switch
                            checked={isYearly}
                            onCheckedChange={(checked) => setPeriod(checked ? "YEARLY" : "MONTHLY")}
                        />
                        <span className={`text-xs ${isYearly ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                            {tPricing("yearly")}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: "FREE", icon: Sparkles, color: "emerald", monthly: tPricing("plans.free.price"), yearly: tPricing("plans.free.price") },
                        { id: "PRO", icon: Zap, color: "blue", monthly: tPricing("plans.pro.priceMonthly"), yearly: tPricing("plans.pro.priceYearly") },
                        { id: "PREMIUM", icon: Crown, color: "purple", monthly: tPricing("plans.premium.priceMonthly"), yearly: tPricing("plans.premium.priceYearly") }
                    ].map((plan) => (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => setPlan(plan.id)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 ${selectedPlan === plan.id
                                ? `border-${plan.color}-500 bg-${plan.color}-500/5 shadow-sm`
                                : "border-border/50 hover:border-border bg-muted/30"
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg ${selectedPlan === plan.id
                                ? `bg-${plan.color}-500/20 text-${plan.color}-500`
                                : "bg-muted text-muted-foreground"
                                }`}>
                                <plan.icon className="h-4 w-4" />
                            </div>
                            <div className="text-center">
                                <p className={`text-[10px] font-bold uppercase tracking-tighter ${selectedPlan === plan.id ? `text-${plan.color}-500` : "text-muted-foreground"
                                    }`}>
                                    {plan.id}
                                </p>
                                <p className="text-[10px] font-medium text-muted-foreground">
                                    {isYearly ? plan.yearly : plan.monthly}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tCommon("email")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="john.doe@example.com"
                                            type="email"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{tCommon("password")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="******"
                                            type="password"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="text-right">
                            <a
                                href="/auth/forgot-password"
                                className="text-sm text-primary hover:underline"
                            >
                                {t("forgotPassword")}
                            </a>
                        </div>
                    </div>
                    <FormError message={error || urlError} />
                    <FormSuccess message={success} />
                    <Button
                        disabled={isPending}
                        type="submit"
                        className="w-full"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("submitting")}
                            </>
                        ) : (
                            t("submit")
                        )}
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    );
};

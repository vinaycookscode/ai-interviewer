"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

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
import { CardWrapper } from "@/components/auth/card-wrapper";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { coralButton, fieldError, fieldInput, fieldLabel, focusRing } from "@/components/soft-glass/classes";
import { login } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";

import { planSelectionQuery, readPlanSelection } from "@/lib/plan-selection";

import { useTranslations } from "next-intl";

const PLAN_KEYS = { PRO: "pro", PREMIUM: "premium" } as const;

export const LoginForm = () => {
    const t = useTranslations("Auth.login");
    const tCommon = useTranslations("Common");
    const tPricing = useTranslations("Pricing");
    const tPlans = useTranslations("Landing.pricing.plans");
    const searchParams = useSearchParams();
    const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
        ? t("errors.oauthAccountNotLinked")
        : "";

    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // Plan picked on the landing or pricing page, if any. Returning users don't pick here;
    // a paid choice just carries on to checkout after sign-in.
    const selection = readPlanSelection(searchParams);
    const selectedPlan = selection.plan ?? "FREE";
    const selectedPeriod = selection.period ?? "MONTHLY";

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        setError("");
        setSuccess("");

        let callbackUrl = searchParams.get("callbackUrl") || undefined;

        // If plan was selected on homepage, redirect to pricing after auth
        if (!callbackUrl && selectedPlan && selectedPlan !== "FREE") {
            callbackUrl = `/candidate/pricing?${planSelectionQuery(selectedPlan, selectedPeriod)}`;
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
                .catch((error) => {
                    // NextAuth throws NEXT_REDIRECT on successful login - don't show error
                    if (error?.message?.includes("NEXT_REDIRECT") || error?.digest?.includes("NEXT_REDIRECT")) {
                        return;
                    }
                    setError(t("errors.generic"));
                });
        });
    };

    return (
        <CardWrapper
            title={t("title")}
            description={t("description")}
            footer={{ prompt: t("noAccount"), label: t("createAccount"), href: "/auth/register" }}
        >
            {selectedPlan !== "FREE" && (
                <p className="mb-6 rounded-2xl bg-sg-lavender-soft px-4 py-3 text-sm font-semibold text-sg-lavender-ink">
                    {t("planNote", {
                        plan: tPlans(`${PLAN_KEYS[selectedPlan]}.name`),
                        period: selectedPeriod === "YEARLY" ? tPricing("yearly") : tPricing("monthly"),
                    })}
                </p>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={fieldLabel}>{tCommon("email")}</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        placeholder="you@example.com"
                                        type="email"
                                        autoComplete="email"
                                        className={fieldInput}
                                    />
                                </FormControl>
                                <FormMessage className={fieldError} />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between gap-3">
                                    <FormLabel className={fieldLabel}>{tCommon("password")}</FormLabel>
                                    <Link
                                        href="/auth/forgot-password"
                                        className={cn("rounded text-sm font-semibold text-sg-lavender-ink underline-offset-4 hover:underline", focusRing)}
                                    >
                                        {t("forgotPassword")}
                                    </Link>
                                </div>
                                <FormControl>
                                    <Input
                                        {...field}
                                        disabled={isPending}
                                        type="password"
                                        autoComplete="current-password"
                                        className={fieldInput}
                                    />
                                </FormControl>
                                <FormMessage className={fieldError} />
                            </FormItem>
                        )}
                    />
                    <FormError message={error || urlError} />
                    <FormSuccess message={success} />
                    <button disabled={isPending} type="submit" className={cn(coralButton, "mt-1 h-12 w-full")}>
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {isPending ? t("submitting") : t("submit")}
                    </button>
                </form>
            </Form>
        </CardWrapper>
    );
};

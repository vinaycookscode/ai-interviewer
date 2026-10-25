"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { RegisterSchema } from "@/schemas";
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
import { register } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

import { planSelectionQuery, readPlanSelection } from "@/lib/plan-selection";

import { useTranslations } from "next-intl";

const PLANS = [
    { id: "FREE", key: "free" },
    { id: "PRO", key: "pro" },
    { id: "PREMIUM", key: "premium" },
] as const;

export const RegisterForm = () => {
    const t = useTranslations("Auth.register");
    const tCommon = useTranslations("Common");
    const tPricing = useTranslations("Pricing");
    const tLanding = useTranslations("Landing.pricing");
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const planLabelId = useId();

    // Plan picked on the pricing page, if any
    const selection = readPlanSelection(searchParams);
    const selectedPlan = selection.plan ?? "FREE";
    const selectedPeriod = selection.period ?? "MONTHLY";
    const isYearly = selectedPeriod === "YEARLY";

    // Invited candidates are here for an employer's interview, not to pick a plan
    const callbackUrlParam = searchParams.get("callbackUrl");
    const isInterviewInvitation = callbackUrlParam?.includes("/interview/");

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
            role: "CANDIDATE",
        },
    });

    const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
        setError("");
        setSuccess("");

        // Get callbackUrl from URL params
        const existingCallbackUrl = searchParams.get("callbackUrl");

        // If plan was selected or present in URL, redirect to pricing after auth
        let callbackUrl = existingCallbackUrl;
        if (!callbackUrl && selectedPlan && selectedPlan !== "FREE") {
            callbackUrl = `/candidate/pricing?${planSelectionQuery(selectedPlan, selectedPeriod)}`;
        }

        startTransition(() => {
            register(values, callbackUrl || undefined)
                .then((data) => {
                    setError(data.error);
                    setSuccess(data.success);
                });
        });
    };

    const setPlan = (plan: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("plan", plan);
        params.set("period", selectedPeriod);
        params.delete("s");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const setPeriod = (period: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("plan", selectedPlan);
        params.set("period", period);
        params.delete("s");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const periodButton = (active: boolean) =>
        cn(
            "h-8 rounded-full px-3 text-[13px] font-bold transition-colors",
            focusRing,
            active ? "bg-sg-ink text-sg-ink-foreground" : "text-sg-muted hover:text-sg-text"
        );

    const price = (key: (typeof PLANS)[number]["key"]) =>
        key === "free" ? tPricing("plans.free.price") : tPricing(isYearly ? `plans.${key}.priceYearly` : `plans.${key}.priceMonthly`);

    return (
        <CardWrapper
            title={t("title")}
            description={t("description")}
            footer={{ prompt: t("alreadyHaveAccount"), label: t("signIn"), href: "/auth/login" }}
        >
            {!isInterviewInvitation && (
                <div className="mb-7">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                        <span id={planLabelId} className="whitespace-nowrap text-sm font-semibold">
                            {t("selectPlan")}
                        </span>
                        <div role="group" aria-label={tLanding("periodLabel")} className="inline-flex gap-0.5 rounded-full bg-sg-chip p-1">
                            <button type="button" aria-pressed={!isYearly} onClick={() => setPeriod("MONTHLY")} className={periodButton(!isYearly)}>
                                {tPricing("monthly")}
                            </button>
                            <button type="button" aria-pressed={isYearly} onClick={() => setPeriod("YEARLY")} className={periodButton(isYearly)}>
                                {tPricing("yearly")}
                            </button>
                        </div>
                    </div>
                    {/* Three across from 400px; narrower, "Premium" barely fits a third of the card, so plans become rows. */}
                    <div role="group" aria-labelledby={planLabelId} className="mt-3 grid gap-2 min-[400px]:grid-cols-3">
                        {PLANS.map((plan) => {
                            const selected = selectedPlan === plan.id;
                            return (
                                <button
                                    key={plan.id}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => setPlan(plan.id)}
                                    className={cn(
                                        "flex min-w-0 items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left transition-colors min-[400px]:flex-col min-[400px]:items-start min-[400px]:justify-start min-[400px]:gap-0.5",
                                        focusRing,
                                        selected
                                            ? "border-sg-lavender bg-sg-lavender-soft text-sg-lavender-ink"
                                            : "border-sg-field-border bg-sg-row hover:border-sg-lavender"
                                    )}
                                >
                                    <span className="text-sm font-bold">{tLanding(`plans.${plan.key}.name`)}</span>
                                    <span className={cn("text-[13px] font-semibold", !selected && "text-sg-muted")}>{price(plan.key)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={fieldLabel}>{t("name")}</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled={isPending} autoComplete="name" className={fieldInput} />
                                </FormControl>
                                <FormMessage className={fieldError} />
                            </FormItem>
                        )}
                    />
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
                                <FormLabel className={fieldLabel}>{tCommon("password")}</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled={isPending} type="password" autoComplete="new-password" className={fieldInput} />
                                </FormControl>
                                <FormMessage className={fieldError} />
                            </FormItem>
                        )}
                    />
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <button disabled={isPending} type="submit" className={cn(coralButton, "mt-1 h-12 w-full")}>
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {isPending ? t("submitting") : t("submit")}
                    </button>
                    {/* Employer sign-up is invite-only; don't let employers silently become candidates */}
                    {!isInterviewInvitation && (
                        <p className="text-center text-sm text-sg-muted">
                            {t("employerQuestion")}{" "}
                            <a
                                href="mailto:hello@getbacktou.com"
                                className={cn("rounded font-bold text-sg-text underline-offset-4 hover:underline", focusRing)}
                            >
                                {t("employerContact")}
                            </a>
                        </p>
                    )}
                </form>
            </Form>
        </CardWrapper>
    );
};

"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { register } from "@/actions/auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Crown, Zap, Sparkles } from "lucide-react";
import Link from "next/link";

import { decryptData, encryptData } from "@/lib/encryption";

export const RegisterForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Decode encrypted state if present
    const s = searchParams.get("s");
    const decrypted = s ? decryptData(s) : null;

    const selectedPlan = decrypted?.plan || searchParams.get("plan") || "FREE";
    const selectedPeriod = decrypted?.period || searchParams.get("period") || "MONTHLY";
    const isYearly = selectedPeriod === "YEARLY";

    // Check if user is coming from interview invitation
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
            const encrypted = encryptData({ plan: selectedPlan, period: selectedPeriod });
            callbackUrl = `/candidate/pricing?s=${encrypted}`;
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
        const encrypted = encryptData({ plan, period: selectedPeriod });
        params.set("s", encrypted);
        // Remove legacy params if any
        params.delete("plan");
        params.delete("period");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const setPeriod = (period: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const encrypted = encryptData({ plan: selectedPlan, period });
        params.set("s", encrypted);
        // Remove legacy params if any
        params.delete("plan");
        params.delete("period");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <CardWrapper
            headerLabel="Create an account"
            backButtonLabel="Already have an account?"
            backButtonHref="/auth/login"
        >
            <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-medium text-muted-foreground">Select your plan</p>
                    <div className="flex items-center gap-2 scale-75 origin-right">
                        <span className={`text-xs ${!isYearly ? "text-foreground font-bold" : "text-muted-foreground"}`}>Monthly</span>
                        <Switch
                            checked={isYearly}
                            onCheckedChange={(checked) => setPeriod(checked ? "YEARLY" : "MONTHLY")}
                        />
                        <span className={`text-xs ${isYearly ? "text-foreground font-bold" : "text-muted-foreground"}`}>Yearly</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { id: "FREE", icon: Sparkles, color: "emerald", monthly: "Free", yearly: "Free" },
                        { id: "PRO", icon: Zap, color: "blue", monthly: "₹249", yearly: "₹2,490" },
                        { id: "PREMIUM", icon: Crown, color: "purple", monthly: "₹499", yearly: "₹4,990" }
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="John Doe"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
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
                                    <FormLabel>Password</FormLabel>
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
                        {!isInterviewInvitation && (
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>I am a...</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                                disabled={isPending}
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="CANDIDATE" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Candidate (I want to be interviewed)
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="EMPLOYER" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Employer (I want to hire)
                                                    </FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <Button
                        disabled={isPending}
                        type="submit"
                        className="w-full"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create an account"
                        )}
                    </Button>
                </form>
            </Form>
        </CardWrapper>
    );
};

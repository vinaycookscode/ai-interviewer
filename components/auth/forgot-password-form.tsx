"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

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
import { coralButton, fieldError, fieldInput, fieldLabel } from "@/components/soft-glass/classes";
import { forgotPassword } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const ForgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email"),
});

export const ForgotPasswordForm = () => {
    const t = useTranslations("Auth");
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof ForgotPasswordSchema>>({
        resolver: zodResolver(ForgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = (values: z.infer<typeof ForgotPasswordSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            forgotPassword(values)
                .then((data) => {
                    if (data?.error) {
                        setError(data.error);
                    }
                    if (data?.success) {
                        setSuccess(data.success);
                        form.reset();
                    }
                })
                .catch(() => setError("Something went wrong"));
        });
    };

    return (
        <CardWrapper
            title={t("forgotPassword.title")}
            description={t("forgotPassword.description")}
            footer={{ label: t("forgotPassword.backToLogin"), href: "/auth/login" }}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={fieldLabel}>{t("email")}</FormLabel>
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
                    <FormError message={error} />
                    <FormSuccess message={success} />
                    <button disabled={isPending} type="submit" className={cn(coralButton, "mt-1 h-12 w-full")}>
                        {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {isPending ? t("forgotPassword.sending") : t("forgotPassword.sendLink")}
                    </button>
                </form>
            </Form>
        </CardWrapper>
    );
};

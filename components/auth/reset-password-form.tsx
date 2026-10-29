"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { FormError } from "@/components/auth/form-error";
import { FormSuccess } from "@/components/auth/form-success";
import { coralButton, fieldError, fieldHint, fieldInput, fieldLabel } from "@/components/soft-glass/classes";
import { PasswordSchema } from "@/schemas";
import { resetPassword } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const ResetPasswordFormSchema = z.object({
    password: PasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export const ResetPasswordForm = () => {
    const t = useTranslations("Auth");
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof ResetPasswordFormSchema>>({
        resolver: zodResolver(ResetPasswordFormSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    });

    const footer = { label: t("forgotPassword.backToLogin"), href: "/auth/login" };

    if (!token) {
        return (
            <CardWrapper title={t("resetPassword.invalidTitle")} description={t("resetPassword.invalidLink")} footer={footer}>
                <Link href="/auth/forgot-password" className={cn(coralButton, "h-12 w-full")}>
                    {t("resetPassword.requestNew")}
                </Link>
            </CardWrapper>
        );
    }

    const onSubmit = (values: z.infer<typeof ResetPasswordFormSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            resetPassword({ token, password: values.password })
                .then((data) => {
                    if (data?.error) {
                        setError(data.error);
                    }
                    if (data?.success) {
                        setSuccess(data.success);
                        form.reset();
                        // Redirect to login after 2 seconds
                        setTimeout(() => {
                            router.push("/auth/login");
                        }, 2000);
                    }
                })
                .catch(() => setError("Something went wrong"));
        });
    };

    return (
        <CardWrapper title={t("resetPassword.title")} footer={footer}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={fieldLabel}>{t("resetPassword.newPassword")}</FormLabel>
                                <FormControl>
                                    <Input {...field} disabled={isPending} type="password" autoComplete="new-password" className={fieldInput} />
                                </FormControl>
                                <FormDescription className={fieldHint}>{t("passwordRules")}</FormDescription>
                                <FormMessage className={fieldError} />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className={fieldLabel}>{t("resetPassword.confirmPassword")}</FormLabel>
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
                        {isPending ? t("resetPassword.resetting") : t("resetPassword.reset")}
                    </button>
                </form>
            </Form>
        </CardWrapper>
    );
};

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateProfile } from "@/actions/profile";
import { field, fieldLabel, inkButton } from "@/components/jobs/employer-ui";

/** Name (editable) and sign-in email (read-only). */
export function SettingsForm({ name, email }: { name: string; email: string }) {
    const t = useTranslations("Employer.settings");
    const router = useRouter();
    const [value, setValue] = useState(name);
    const [error, setError] = useState(false);
    const [isPending, startTransition] = useTransition();

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        const next = value.trim();
        if (!next) {
            setError(true);
            return;
        }
        setError(false);
        startTransition(async () => {
            const result = await updateProfile({ name: next });
            if (result.success) {
                toast.success(t("saved"));
                router.refresh();
            } else {
                toast.error(t("saveFailed"));
            }
        });
    }

    return (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex min-w-0 flex-col gap-2">
                <label htmlFor="es-name" className={fieldLabel}>
                    {t("name")}
                </label>
                <input
                    id="es-name"
                    type="text"
                    autoComplete="name"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    aria-invalid={error}
                    aria-describedby={error ? "es-name-error" : undefined}
                    className={cn(field, "h-12")}
                />
                {error && (
                    <span id="es-name-error" role="alert" className="text-[13px] font-semibold text-sg-danger">
                        {t("nameRequired")}
                    </span>
                )}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
                <label htmlFor="es-email" className={fieldLabel}>
                    {t("email")}
                </label>
                <input
                    id="es-email"
                    readOnly
                    value={email}
                    aria-describedby="es-email-hint"
                    className={cn(field, "h-12 bg-sg-chip text-sg-muted")}
                />
                <span id="es-email-hint" className="text-[13px] leading-[18px] font-medium text-sg-muted">
                    {t("emailHint")}
                </span>
            </div>
            <button type="submit" disabled={isPending || value.trim() === name} className={cn(inkButton, "h-12 self-start")}>
                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {t("save")}
            </button>
        </form>
    );
}

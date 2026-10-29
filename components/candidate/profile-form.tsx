"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile";
import { field, fieldLabel, inkButton } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

/** Name and (read-only) email. */
export function AccountForm({ name: initialName, email }: { name: string; email: string }) {
    const t = useTranslations("Profile");
    const router = useRouter();
    const [name, setName] = useState(initialName);
    const [isPending, startTransition] = useTransition();

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await updateProfile({ name: name.trim() });
            if (result.success) {
                toast.success(t("saved"));
                router.refresh();
            } else {
                toast.error(t("saveFailed"));
            }
        });
    };

    return (
        <form onSubmit={save} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label htmlFor="pf-name" className={fieldLabel}>
                    {t("name")}
                </label>
                <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} className={cn(field, "h-12")} />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="pf-email" className={fieldLabel}>
                    {t("email")}
                </label>
                <input id="pf-email" type="email" value={email} readOnly aria-describedby="pf-email-hint" className={cn(field, "h-12 bg-sg-chip")} />
                <span id="pf-email-hint" className="text-[13px] leading-[18px] text-sg-muted">
                    {t("emailHint")}
                </span>
            </div>
            <button type="submit" disabled={isPending || !name.trim() || name.trim() === initialName} className={cn(inkButton, "h-12 self-start")}>
                {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {isPending ? t("saving") : t("save")}
            </button>
        </form>
    );
}

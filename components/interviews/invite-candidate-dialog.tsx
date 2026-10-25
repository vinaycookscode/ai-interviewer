"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, CheckCircle2, Copy, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { coralButton } from "@/components/soft-glass/classes";
import { inviteCandidate } from "@/actions/interview";
import { field, fieldLabel, inkButton, outlineButton } from "@/components/jobs/employer-ui";
import { Dialog, DialogClose, DialogPanel, DialogTrigger } from "@/components/interviews/sg-dialog";

const formSchema = z.object({
    candidateName: z.string().min(2, "name"),
    candidateEmail: z.string().email("email"),
    scheduledTime: z.string().min(1, "time"),
    expiresAt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Earliest start: an hour from now.
function getMinDateTime() {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
}

export function InviteCandidateDialog({ jobId }: { jobId: string }) {
    const t = useTranslations("Employer.invite");
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState<{ email: string; link: string | null } | null>(null);
    const [copied, setCopied] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { candidateName: "", candidateEmail: "", scheduledTime: "", expiresAt: "" },
    });
    const { errors } = form.formState;

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        setError(null);
        try {
            const result = await inviteCandidate({
                jobId,
                candidateName: values.candidateName,
                candidateEmail: values.candidateEmail,
                scheduledTime: new Date(values.scheduledTime).toISOString(),
                expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
            });

            if (result.success) {
                form.reset();
                router.refresh();
                setSent({ email: values.candidateEmail, link: result.interviewLink ?? null });
            } else {
                setError(result.error || t("failed"));
            }
        } catch (err) {
            console.error("Failed to invite candidate", err);
            setError(t("failed"));
        } finally {
            setIsLoading(false);
        }
    }

    async function copyToClipboard() {
        if (!sent?.link) return;
        await navigator.clipboard.writeText(sent.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleOpenChange(isOpen: boolean) {
        setOpen(isOpen);
        if (!isOpen) {
            setSent(null);
            setCopied(false);
            setError(null);
            form.reset();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger className={cn(coralButton, "h-12 px-[22px]")}>
                <UserPlus className="size-5" aria-hidden="true" />
                {t("trigger")}
            </DialogTrigger>

            <DialogPanel title={sent ? t("sentTitle") : t("title")} description={sent ? undefined : t("description")} closeLabel={t("close")}>
                {!sent ? (
                    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="iv-name" className={fieldLabel}>
                                {t("name")}
                            </label>
                            <input
                                id="iv-name"
                                type="text"
                                autoComplete="off"
                                placeholder={t("namePlaceholder")}
                                aria-invalid={!!errors.candidateName}
                                aria-describedby={errors.candidateName ? "iv-name-error" : undefined}
                                className={cn(field, "h-12")}
                                {...form.register("candidateName")}
                            />
                            {errors.candidateName && <FieldError id="iv-name-error">{t("errorName")}</FieldError>}
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="iv-email" className={fieldLabel}>
                                {t("email")}
                            </label>
                            <input
                                id="iv-email"
                                type="email"
                                autoComplete="off"
                                placeholder={t("emailPlaceholder")}
                                aria-invalid={!!errors.candidateEmail}
                                aria-describedby={errors.candidateEmail ? "iv-email-error" : undefined}
                                className={cn(field, "h-12")}
                                {...form.register("candidateEmail")}
                            />
                            {errors.candidateEmail && <FieldError id="iv-email-error">{t("errorEmail")}</FieldError>}
                        </div>

                        <div className="flex min-w-0 flex-col gap-2">
                            <label htmlFor="iv-time" className={fieldLabel}>
                                {t("startFrom")}
                            </label>
                            <input
                                id="iv-time"
                                type="datetime-local"
                                min={getMinDateTime()}
                                aria-invalid={!!errors.scheduledTime}
                                aria-describedby={errors.scheduledTime ? "iv-time-hint iv-time-error" : "iv-time-hint"}
                                className={cn(field, "h-12")}
                                {...form.register("scheduledTime")}
                            />
                            <span id="iv-time-hint" className="text-[13px] leading-[18px] font-medium text-sg-muted">
                                {t("startHint")}
                            </span>
                            {errors.scheduledTime && <FieldError id="iv-time-error">{t("errorTime")}</FieldError>}
                        </div>

                        {error && (
                            <p role="alert" className="flex items-start gap-2.5 rounded-2xl bg-sg-danger/10 px-4 py-3 text-sm font-semibold text-sg-danger">
                                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                {error}
                            </p>
                        )}

                        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                            <DialogClose className={cn(outlineButton, "h-12 px-5 text-base")}>{t("cancel")}</DialogClose>
                            <button type="submit" disabled={isLoading} className={cn(inkButton, "h-12")}>
                                {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                {t("send")}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-4">
                        <p role="status" className="flex items-start gap-2.5 rounded-2xl bg-sg-success/10 px-4 py-3 text-sm font-semibold text-sg-success">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0 break-words">{t("sentTo", { email: sent.email })}</span>
                        </p>
                        {sent.link && (
                            <div className="flex flex-col gap-2">
                                <label htmlFor="iv-link" className={fieldLabel}>
                                    {t("link")}
                                </label>
                                <div className="flex flex-col gap-2 min-[420px]:flex-row">
                                    <input
                                        id="iv-link"
                                        readOnly
                                        value={sent.link}
                                        onFocus={(e) => e.currentTarget.select()}
                                        className={cn(field, "h-12 min-w-0 font-mono text-sm")}
                                    />
                                    <button type="button" onClick={copyToClipboard} className={cn(inkButton, "h-12 shrink-0")}>
                                        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                                        {copied ? t("copied") : t("copy")}
                                    </button>
                                </div>
                            </div>
                        )}
                        <DialogClose className={cn(outlineButton, "h-12 self-end px-5 text-base")}>{t("done")}</DialogClose>
                    </div>
                )}
            </DialogPanel>
        </Dialog>
    );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <span id={id} className="text-[13px] font-semibold text-sg-danger">
            {children}
        </span>
    );
}

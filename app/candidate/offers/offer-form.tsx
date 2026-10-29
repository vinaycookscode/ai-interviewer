"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createOffer, updateOffer } from "@/actions/job-offers";
import { coralButton, focusRing } from "@/components/soft-glass/classes";
import { field, fieldLabel, outlineButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export interface OfferFormValues {
    id?: string;
    company: string;
    role: string;
    location: string;
    status: string;
    base: number | null;
    bonus: number | null;
    stocks: number | null;
    /** yyyy-mm-dd */
    deadline: string;
    joining: string;
    notes: string;
    hasLetter: boolean;
}

const STATUSES = ["PENDING", "NEGOTIATING", "ACCEPTED", "REJECTED"] as const;

/** Reads "12,00,000" or "1200000" as a number; null when empty or not a number. */
const amount = (value: string) => {
    const n = Number(value.replace(/[,\s₹]/g, ""));
    return value.trim() && Number.isFinite(n) && n >= 0 ? n : null;
};
const show = (n: number | null) => (n ? Math.round(n).toLocaleString("en-IN") : "");

export function OfferForm({ initial }: { initial: OfferFormValues }) {
    const t = useTranslations("Offers.form");
    const tStatus = useTranslations("Offers.status");
    const router = useRouter();
    const isEdit = !!initial.id;
    const [isPending, startTransition] = useTransition();
    const [values, setValues] = useState({
        company: initial.company,
        role: initial.role,
        location: initial.location,
        status: initial.status,
        base: show(initial.base),
        bonus: show(initial.bonus),
        stocks: show(initial.stocks),
        deadline: initial.deadline,
        joining: initial.joining,
        notes: initial.notes,
    });
    const [letter, setLetter] = useState<{ url: string; name: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value }));

    const base = amount(values.base);
    const companyMissing = !values.company.trim();
    const baseMissing = !base;
    const totalYear = (base ?? 0) + (amount(values.bonus) ?? 0) + (amount(values.stocks) ?? 0);

    const uploadLetter = async (file: File) => {
        setUploading(true);
        try {
            const body = new FormData();
            body.append("file", file);
            body.append("type", "offer");
            const response = await fetch("/api/upload/profile", { method: "POST", body });
            if (!response.ok) throw new Error("upload failed");
            setLetter(await response.json());
        } catch {
            toast.error(t("letterFailed"));
        } finally {
            setUploading(false);
        }
    };

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        if (companyMissing || baseMissing) {
            setShowErrors(true);
            document.getElementById(companyMissing ? "of-company" : "of-base")?.focus();
            return;
        }
        const data = {
            company: values.company.trim(),
            role: values.role.trim(),
            location: values.location.trim(),
            baseSalary: base!,
            bonus: amount(values.bonus) ?? undefined,
            stocks: amount(values.stocks) ?? undefined,
            deadline: values.deadline ? new Date(values.deadline) : undefined,
            joiningDate: values.joining ? new Date(values.joining) : undefined,
            notes: values.notes.trim() || undefined,
            offerLetterUrl: letter?.url,
            status: values.status,
        };
        startTransition(async () => {
            const result = isEdit ? await updateOffer(initial.id!, data) : await createOffer(data);
            if ("error" in result && result.error) {
                toast.error(t("failed"));
                return;
            }
            router.push("/candidate/offers");
            router.refresh();
        });
    };

    const inputClass = (invalid: boolean) => cn(field, "h-12", invalid && "border-sg-danger");

    return (
        <form onSubmit={save} noValidate className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
            <div className="flex flex-col gap-2">
                <Link href="/candidate/offers" className={cn("inline-flex items-center gap-1.5 self-start rounded-md font-semibold text-sg-muted hover:text-sg-text", focusRing)}>
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {t("back")}
                </Link>
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] sm:text-[44px]">
                    {isEdit ? t("editTitle", { company: initial.company }) : t("newTitle")}
                </h1>
            </div>

            {showErrors && (companyMissing || baseMissing) && (
                <div role="alert" className="rounded-2xl bg-sg-danger/10 px-4 py-3 text-sm font-semibold text-sg-danger">
                    {t("errors")}
                </div>
            )}

            <section aria-label={t("job")} className={panel}>
                <h2 className={panelTitle}>{t("job")}</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="of-company" className={fieldLabel}>
                            {t("company")}
                        </label>
                        <input
                            id="of-company"
                            value={values.company}
                            onChange={set("company")}
                            placeholder={t("companyPlaceholder")}
                            aria-invalid={showErrors && companyMissing}
                            aria-describedby={showErrors && companyMissing ? "of-company-error" : undefined}
                            className={inputClass(showErrors && companyMissing)}
                        />
                        {showErrors && companyMissing && (
                            <span id="of-company-error" className="text-sm font-semibold text-sg-danger">
                                {t("companyError")}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="of-role" className={fieldLabel}>
                            {t("role")}
                        </label>
                        <input id="of-role" value={values.role} onChange={set("role")} placeholder={t("rolePlaceholder")} className={inputClass(false)} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="of-location" className={fieldLabel}>
                            {t("city")}
                        </label>
                        <input id="of-location" value={values.location} onChange={set("location")} placeholder={t("cityPlaceholder")} className={inputClass(false)} />
                    </div>
                    {isEdit && (
                        <div className="flex flex-col gap-2">
                            <label htmlFor="of-status" className={fieldLabel}>
                                {t("stands")}
                            </label>
                            <select id="of-status" value={values.status} onChange={set("status")} className={inputClass(false)}>
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                        {tStatus(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </section>

            <section aria-label={t("pay")} className={panel}>
                <h2 className={panelTitle}>{t("pay")}</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
                    {(
                        [
                            ["base", t("base"), showErrors && baseMissing ? t("baseError") : t("baseHint"), showErrors && baseMissing],
                            ["bonus", t("bonus"), t("bonusHint"), false],
                            ["stocks", t("stocks"), t("stocksHint"), false],
                        ] as const
                    ).map(([key, label, hint, invalid]) => (
                        <div key={key} className="flex flex-col gap-2">
                            <label htmlFor={`of-${key}`} className={fieldLabel}>
                                {label}
                            </label>
                            <span className="relative">
                                <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-sg-muted">
                                    ₹
                                </span>
                                <input
                                    id={`of-${key}`}
                                    inputMode="numeric"
                                    value={values[key]}
                                    onChange={set(key)}
                                    placeholder="0"
                                    aria-invalid={invalid}
                                    aria-describedby={`of-${key}-hint`}
                                    className={cn(inputClass(invalid), "pl-8")}
                                />
                            </span>
                            <span id={`of-${key}-hint`} className={cn("text-[13px] leading-[18px]", invalid ? "font-semibold text-sg-danger" : "text-sg-muted")}>
                                {hint}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex items-baseline justify-between gap-3 rounded-[18px] bg-sg-row px-4 py-3">
                    <span className="font-semibold">{t("total")}</span>
                    <span className="font-display sg-soft text-[26px] leading-8 font-semibold">₹{Math.round(totalYear).toLocaleString("en-IN")}</span>
                </div>
            </section>

            <section aria-label={t("dates")} className={panel}>
                <h2 className={panelTitle}>{t("dates")}</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="of-deadline" className={fieldLabel}>
                            {t("deadline")}
                        </label>
                        <input id="of-deadline" type="date" value={values.deadline} onChange={set("deadline")} aria-describedby="of-deadline-hint" className={inputClass(false)} />
                        <span id="of-deadline-hint" className="text-[13px] leading-[18px] text-sg-muted">
                            {t("deadlineHint")}
                        </span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="of-join" className={fieldLabel}>
                            {t("joining")}
                        </label>
                        <input id="of-join" type="date" value={values.joining} onChange={set("joining")} className={inputClass(false)} />
                    </div>
                </div>
            </section>

            <section aria-label={t("letter")} className={panel}>
                <h2 className={panelTitle}>{t("letter")}</h2>
                <label
                    htmlFor="of-letter"
                    className="flex cursor-pointer flex-col items-center gap-1.5 rounded-[18px] border-2 border-dashed border-sg-field-border p-6 text-center hover:bg-sg-chip has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sg-focus"
                >
                    {uploading ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <FileUp className="size-6" aria-hidden="true" />}
                    <span className="font-bold">{letter ? t("letterSaved", { name: letter.name }) : t("letterPick")}</span>
                    <span className="text-sm text-sg-muted">{initial.hasLetter && !letter ? t("letterCurrent") : t("letterHint")}</span>
                    <input
                        id="of-letter"
                        type="file"
                        accept="application/pdf,.pdf"
                        className="sr-only"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadLetter(file);
                        }}
                    />
                </label>
            </section>

            <section aria-label={t("notes")} className={panel}>
                <h2 className={panelTitle}>{t("notes")}</h2>
                <label htmlFor="of-notes" className="sr-only">
                    {t("notes")}
                </label>
                <textarea id="of-notes" rows={4} value={values.notes} onChange={set("notes")} placeholder={t("notesPlaceholder")} className={cn(field, "resize-y py-3")} />
            </section>

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                <Link href="/candidate/offers" className={cn(outlineButton, "h-12 px-6 text-base")}>
                    {t("cancel")}
                </Link>
                <button type="submit" disabled={isPending || uploading} className={cn(coralButton, "h-12 px-7 text-base")}>
                    {isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {isPending ? t("saving") : t("save")}
                </button>
            </div>
        </form>
    );
}

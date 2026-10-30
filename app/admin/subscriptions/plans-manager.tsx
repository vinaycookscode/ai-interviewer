"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateSubscriptionPlan } from "@/actions/admin-subscription";
import { Dialog, DialogPanel } from "@/components/interviews/sg-dialog";
import { fieldInput } from "@/components/soft-glass/classes";
import { inkButton, label, outlineButton, sectionTitle } from "@/components/jobs/employer-ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Plan {
    id: string;
    name: string;
    tier: string;
    monthlyPrice: number;
    yearlyPrice: number;
    mockInterviewLimit: number;
    resumeAnalysisLimit: number;
    questionGenerationLimit: number;
    coverLetterLimit: number;
    resumeRewriteLimit: number;
    aiEvaluationEnabled: boolean;
    prioritySupport: boolean;
    activeSubscribers: number;
}

const LIMITS = ["mockInterviewLimit", "resumeAnalysisLimit", "questionGenerationLimit", "coverLetterLimit", "resumeRewriteLimit"] as const;
type LimitKey = (typeof LIMITS)[number];
const rupees = (paise: number) => (paise / 100).toLocaleString("en-IN");

/** The plans as cards, each editable in a dialog (AIIN-138). Prices are stored in paise and shown in rupees. */
export function PlansManager({ plans }: { plans: Plan[] }) {
    const t = useTranslations("Admin.subscriptions");
    const [editing, setEditing] = useState<Plan | null>(null);
    const limit = (n: number) => (n === -1 ? t("unlimited") : n === 0 ? t("off") : n);

    return (
        <section aria-labelledby="plans-title" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="plans-title" className={sectionTitle}>
                    {t("plans")}
                </h2>
                <span className={label}>{t("plansNote")}</span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
                {plans.map((plan) => (
                    <li key={plan.id} className="sg-glass flex flex-col gap-3.5 rounded-[24px] p-5 sm:p-6">
                        <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xl font-bold">{plan.name}</span>
                            <span className="text-sm text-sg-muted">{t("people", { count: plan.activeSubscribers })}</span>
                        </div>
                        <span className="font-display sg-soft text-[22px] font-semibold">
                            {plan.monthlyPrice === 0 ? t("priceFree") : t("price", { month: rupees(plan.monthlyPrice), year: rupees(plan.yearlyPrice) })}
                        </span>
                        <dl className="flex flex-col gap-1.5 text-[15px]">
                            {LIMITS.map((key) => (
                                <div key={key} className="flex justify-between gap-3 border-t border-sg-rule pt-1.5">
                                    <dt className="text-sg-muted">{t(`limits.${key}`)}</dt>
                                    <dd className="font-semibold">{limit(plan[key])}</dd>
                                </div>
                            ))}
                        </dl>
                        <button type="button" onClick={() => setEditing(plan)} className={cn(outlineButton, "mt-auto h-10 self-start text-sm")}>
                            {t("edit")}
                        </button>
                    </li>
                ))}
            </ul>
            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                {editing && <EditPlan key={editing.id} plan={editing} onDone={() => setEditing(null)} />}
            </Dialog>
        </section>
    );
}

function EditPlan({ plan, onDone }: { plan: Plan; onDone: () => void }) {
    const t = useTranslations("Admin.subscriptions");
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [form, setForm] = useState({
        monthly: String(plan.monthlyPrice / 100),
        yearly: String(plan.yearlyPrice / 100),
        ...Object.fromEntries(LIMITS.map((k) => [k, String(plan[k])])),
        aiEvaluationEnabled: plan.aiEvaluationEnabled,
        prioritySupport: plan.prioritySupport,
    } as { monthly: string; yearly: string; aiEvaluationEnabled: boolean; prioritySupport: boolean } & Record<LimitKey, string>);

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await updateSubscriptionPlan(plan.id, {
                monthlyPrice: Math.round(Number(form.monthly) * 100),
                yearlyPrice: Math.round(Number(form.yearly) * 100),
                ...Object.fromEntries(LIMITS.map((k) => [k, Number(form[k])])),
                aiEvaluationEnabled: form.aiEvaluationEnabled,
                prioritySupport: form.prioritySupport,
            });
            if (!result.success) {
                toast.error(t("saveFailed"));
                return;
            }
            toast.success(t("saved", { name: plan.name }));
            onDone();
            router.refresh();
        });
    };

    const price = (id: string, key: "monthly" | "yearly", text: string) => (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold">
                {text}
            </label>
            <span className="relative">
                <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-sg-muted">
                    ₹
                </span>
                <Input id={id} inputMode="decimal" type="number" min={0} step="1" required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={cn(fieldInput, "pl-8")} />
            </span>
        </div>
    );

    return (
        <DialogPanel title={t("editTitle", { name: plan.name })} closeLabel={t("close")} className="max-w-[560px]">
            <form onSubmit={save} className="flex flex-col gap-4">
                <p className="flex items-start gap-2.5 rounded-[18px] bg-sg-row px-4 py-3 text-sm">
                    <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{t("editNote")}</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    {price("ep-m", "monthly", t("monthly"))}
                    {price("ep-y", "yearly", t("yearly"))}
                </div>
                <fieldset className="flex flex-col gap-2.5">
                    <legend className="text-sm font-semibold">{t("limitsTitle")}</legend>
                    <span className="text-[13px] text-sg-muted">{t("limitsHint")}</span>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {LIMITS.map((k) => (
                            <div key={k} className="flex flex-col gap-1.5">
                                <label htmlFor={`ep-${k}`} className="text-sm font-semibold">
                                    {t(`limits.${k}`)}
                                </label>
                                <Input id={`ep-${k}`} type="number" min={-1} step="1" required value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={fieldInput} />
                            </div>
                        ))}
                    </div>
                </fieldset>
                {(["aiEvaluationEnabled", "prioritySupport"] as const).map((k) => (
                    <label key={k} className="flex items-center gap-2.5 font-semibold">
                        <input type="checkbox" checked={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} className="size-5 accent-[var(--sg-ink)]" />
                        {k === "aiEvaluationEnabled" ? t("aiScoring") : t("priority")}
                    </label>
                ))}
                <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onDone} className={cn(outlineButton, "h-12 px-5 text-base")}>
                        {t("cancel")}
                    </button>
                    <button type="submit" disabled={pending} className={cn(inkButton, "h-12 px-6 text-base")}>
                        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                        {pending ? t("saving") : t("save")}
                    </button>
                </div>
            </form>
        </DialogPanel>
    );
}

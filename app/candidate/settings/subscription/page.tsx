import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { getCurrentSubscription } from "@/actions/subscription";
import { getUsageStats } from "@/lib/usage";
import { toRupees } from "@/lib/razorpay";
import { CancelSubscriptionButton } from "@/components/subscription/subscription-details";
import { coralButton } from "@/components/soft-glass/classes";
import { glassButton, panel, panelTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Subscription | Get Back To U",
    description: "Your plan, what you’ve used this month, and your payments.",
};

const longDate = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const rupees = (paise: number) => toRupees(paise).toLocaleString("en-IN");

export default async function SubscriptionPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const [t, subscription, usage] = await Promise.all([getTranslations("Subscription.page"), getCurrentSubscription(), getUsageStats()]);

    const plan = subscription?.plan;
    const isFree = !subscription || subscription.isFree || plan?.tier === PlanTier.FREE;
    const planName = plan?.name ?? t("free");
    const periodEnd = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const status = subscription?.status ?? "ACTIVE";
    const yearly = subscription?.billingPeriod === "YEARLY";
    const price = plan ? rupees(yearly ? plan.yearlyPrice : plan.monthlyPrice) : "0";
    const now = new Date();
    const resets = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const note = isFree
        ? t("freeNote")
        : status === "CANCELLED" && periodEnd
          ? t("endsOn", { plan: planName, date: longDate(periodEnd) })
          : status === "PAST_DUE"
            ? t("pastDue", { plan: planName })
            : status === "EXPIRED" && periodEnd
              ? t("expired", { date: longDate(periodEnd) })
              : periodEnd
                ? t("renews", { date: longDate(periodEnd) })
                : "";

    const payments = (subscription?.payments ?? []).map((p) => ({
        id: p.id,
        date: longDate(new Date(p.createdAt)),
        amount: rupees(p.amount),
        status: p.status,
    }));

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[680px] flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{t("title")}</h1>
                <p className="text-lg text-sg-muted">{t("description")}</p>
            </div>

            <section aria-label={t("yourPlan")} className="sg-glass sg-shadow-lg flex flex-wrap items-center justify-between gap-5 rounded-[24px] p-5 sm:rounded-[28px] sm:p-7">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[13px] leading-[18px] font-bold text-sg-muted">{t("yourPlan")}</span>
                    <span className="flex flex-wrap items-baseline gap-x-3">
                        <span className="font-display sg-soft text-[34px] leading-10 font-semibold">{planName}</span>
                        {!isFree && <span className="font-semibold text-sg-muted">{yearly ? t("perYear", { price }) : t("perMonth", { price })}</span>}
                    </span>
                    {note && <span className="text-sg-muted">{note}</span>}
                </div>
                {isFree ? (
                    <Link href="/candidate/pricing" className={cn(coralButton, "h-12 px-6 text-base")}>
                        {t("seePlans")}
                    </Link>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/candidate/pricing" className={cn(glassButton, "h-11 text-[15px]")}>
                            {t("change")}
                        </Link>
                        {status === "ACTIVE" && periodEnd && <CancelSubscriptionButton planName={planName} until={longDate(periodEnd)} />}
                    </div>
                )}
            </section>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-start gap-6">
                <section aria-label={t("month")} className={panel}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className={panelTitle}>{t("month")}</h2>
                        <span className="text-sm font-semibold text-sg-muted">{t("resets", { date: resets.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) })}</span>
                    </div>
                    <ul className="flex flex-col gap-3.5">
                        {usage.features.map((f) => {
                            const unlimited = f.limit === -1;
                            const percent = unlimited || f.limit <= 0 ? 0 : Math.min(100, Math.round((f.currentUsage / f.limit) * 100));
                            return (
                                <li key={f.featureType} className="flex flex-col gap-1.5">
                                    <span className="flex justify-between gap-3">
                                        <span className="font-semibold">{f.displayName}</span>
                                        <span className="text-sm font-bold">{unlimited ? t("unlimited") : t("usedOf", { used: f.currentUsage, limit: f.limit })}</span>
                                    </span>
                                    {!unlimited && f.limit > 0 && (
                                        <span
                                            role="progressbar"
                                            aria-label={t("usedLabel", { name: f.displayName, used: f.currentUsage, limit: f.limit })}
                                            aria-valuenow={f.currentUsage}
                                            aria-valuemin={0}
                                            aria-valuemax={f.limit}
                                            className="h-2 overflow-hidden rounded-full bg-sg-track"
                                        >
                                            <span className={cn("block h-full rounded-full", percent >= 100 ? "bg-sg-coral" : "bg-sg-lavender-ink")} style={{ width: `${percent}%` }} />
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section aria-label={t("payments")} className={panel}>
                    <h2 className={panelTitle}>{t("payments")}</h2>
                    {payments.length === 0 ? (
                        <p className="text-sg-muted">{t("noPayments")}</p>
                    ) : (
                        <>
                            <ul className="flex flex-col gap-2">
                                {payments.map((p) => {
                                    const paid = p.status === "captured";
                                    const refunded = p.status === "refunded";
                                    const Icon = paid ? CheckCircle2 : refunded ? RotateCcw : XCircle;
                                    return (
                                        <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[18px] bg-sg-row px-4 py-3">
                                            <span className="flex min-w-0 flex-[1_1_140px] flex-col">
                                                <span className="font-semibold">{p.date}</span>
                                                <span className="text-[13px] leading-[18px] text-sg-muted">{planName}</span>
                                            </span>
                                            <span className="font-bold">₹{p.amount}</span>
                                            <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", paid ? "text-sg-success" : refunded ? "text-sg-muted" : "text-sg-danger")}>
                                                <Icon className="size-4" aria-hidden="true" />
                                                {paid ? t("paid") : refunded ? t("refunded") : t("failed")}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="text-sm text-sg-muted">{t("paymentsNote")}</p>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

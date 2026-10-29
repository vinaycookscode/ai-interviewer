import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { auth } from "@/auth";
import { getSubscriptionPlans, getCurrentSubscription } from "@/actions/subscription";
import { PricingCards } from "@/components/subscription/pricing-cards";
import { getRazorpayKeyId } from "@/lib/razorpay";
import { focusRing } from "@/components/soft-glass/classes";
import { sectionTitle } from "@/components/jobs/employer-ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Plans | Get Back To U",
    description: "Every plan has the same AI interviewer. Paid plans give you more of it.",
};

export default async function PricingPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const [t, tLanding, plans, currentSubscription] = await Promise.all([
        getTranslations("Pricing.page"),
        getTranslations("Landing.pricing"),
        getSubscriptionPlans(),
        getCurrentSubscription(),
    ]);
    const faq = t.raw("items") as { q: string; a: string }[];

    return (
        <div className="flex flex-col gap-6 sm:gap-9">
            <div className="flex max-w-[680px] flex-col gap-2">
                <h1 className="font-display sg-soft text-[32px] font-semibold leading-[1.14] tracking-[-0.025em] text-balance sm:text-[44px]">{tLanding("title")}</h1>
                <p className="text-lg text-sg-muted">{t("description")}</p>
            </div>

            <PricingCards plans={plans} currentPlanTier={currentSubscription?.plan?.tier} razorpayKeyId={getRazorpayKeyId()} />

            <section aria-label={t("faq")} className="flex max-w-[760px] flex-col gap-4">
                <h2 className={sectionTitle}>{t("faq")}</h2>
                <div className="flex flex-col gap-2.5">
                    {faq.map((item) => (
                        <details key={item.q} className="group sg-glass rounded-[20px] px-5 py-4">
                            <summary className={cn("flex cursor-pointer list-none items-center justify-between gap-3 rounded-md font-bold [&::-webkit-details-marker]:hidden", focusRing)}>
                                {item.q}
                                <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                            </summary>
                            <p className="mt-2 text-sg-muted">{item.a}</p>
                        </details>
                    ))}
                </div>
            </section>
        </div>
    );
}

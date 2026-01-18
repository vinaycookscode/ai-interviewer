import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSubscriptionPlans, getCurrentSubscription } from "@/actions/subscription";
import { PricingCards } from "@/components/subscription/pricing-cards";
import { getRazorpayKeyId } from "@/lib/razorpay";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "Pricing | AI Interviewer",
    description: "Choose the perfect plan for your interview preparation journey",
};

export default async function PricingPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/login");
    }

    const [plans, currentSubscription] = await Promise.all([
        getSubscriptionPlans(),
        getCurrentSubscription(),
    ]);

    const razorpayKeyId = getRazorpayKeyId();

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-medium">Upgrade Your Journey</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">
                    Choose Your Plan
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Unlock powerful AI features to accelerate your interview preparation
                    and land your dream job.
                </p>
            </div>

            {/* Pricing Cards */}
            <PricingCards
                plans={plans}
                currentPlanTier={currentSubscription?.plan?.tier}
                razorpayKeyId={razorpayKeyId}
            />

            {/* FAQ Section */}
            <div className="mt-16 space-y-8">
                <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
                <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                    <FaqItem
                        question="Can I cancel anytime?"
                        answer="Yes! You can cancel your subscription at any time. You'll continue to have access to your plan's features until the end of your billing period."
                    />
                    <FaqItem
                        question="What payment methods do you accept?"
                        answer="We accept all major credit/debit cards, UPI, net banking, and popular wallets through Razorpay's secure payment gateway."
                    />
                    <FaqItem
                        question="What happens when I upgrade?"
                        answer="When you upgrade, you'll immediately get access to all the features of your new plan. Your billing cycle will restart from the upgrade date."
                    />
                    <FaqItem
                        question="Is my payment information secure?"
                        answer="Absolutely! We use Razorpay, a PCI-DSS compliant payment gateway. We never store your card details on our servers."
                    />
                    <FaqItem
                        question="Can I switch between monthly and yearly?"
                        answer="Yes! You can switch between billing periods when your current period ends. Yearly plans save you 17% compared to monthly billing."
                    />
                    <FaqItem
                        question="What if I need more features?"
                        answer="If you need custom limits or enterprise features, contact us at hello@getbacktou.com and we'll create a tailored plan for you."

                    />
                </div>
            </div>
        </div>
    );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="space-y-2 p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold">{question}</h3>
            <p className="text-sm text-muted-foreground">{answer}</p>
        </div>
    );
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { BriefcaseBusiness, Plus, IndianRupee, MapPin, Calendar } from "lucide-react";
import Link from "next/link";

export default async function OffersPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.OFFER_COMPARATOR);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Offers</h1>
                    <p className="text-muted-foreground">
                        Track and compare your job offers
                    </p>
                </div>
                <Link
                    href="/candidate/offers/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Add Offer
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Offers</p>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Pending Decision</p>
                    <p className="text-3xl font-bold text-yellow-500">0</p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Accepted</p>
                    <p className="text-3xl font-bold text-green-500">0</p>
                </div>
            </div>

            {/* Empty State */}
            <div className="bg-card border rounded-xl p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                    <BriefcaseBusiness className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No Offers Yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    When you receive job offers, add them here to track deadlines,
                    compare compensation, and make informed decisions.
                </p>
                <Link
                    href="/candidate/offers/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Add Your First Offer
                </Link>
            </div>

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <IndianRupee className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-semibold">Salary Comparison</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Compare base salary, bonuses, and total compensation
                    </p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <MapPin className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-semibold">Location Analysis</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Adjust for cost of living in different cities
                    </p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <Calendar className="h-5 w-5 text-emerald-500" />
                        <h3 className="font-semibold">Deadline Tracking</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Never miss an offer deadline with smart reminders
                    </p>
                </div>
            </div>
        </div>
    );
}

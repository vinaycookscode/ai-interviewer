import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getUserOffers } from "@/actions/job-offers";
import { BriefcaseBusiness, Plus, IndianRupee, MapPin, Calendar, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";

function formatSalary(amount: number): string {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    }
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
}

function getStatusColor(status: string): string {
    switch (status) {
        case "ACCEPTED": return "text-green-500 bg-green-500/10";
        case "REJECTED": return "text-red-500 bg-red-500/10";
        case "DECLINED": return "text-gray-500 bg-gray-500/10";
        default: return "text-yellow-500 bg-yellow-500/10";
    }
}

export default async function OffersPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.OFFER_COMPARATOR);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

    // Fetch actual offers from database
    const offers = await getUserOffers(session.user.id);

    // Calculate stats
    const totalOffers = offers.length;
    const pendingOffers = offers.filter(o => o.status === "PENDING").length;
    const acceptedOffers = offers.filter(o => o.status === "ACCEPTED").length;

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
                    <p className="text-3xl font-bold">{totalOffers}</p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Pending Decision</p>
                    <p className="text-3xl font-bold text-yellow-500">{pendingOffers}</p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <p className="text-sm text-muted-foreground mb-1">Accepted</p>
                    <p className="text-3xl font-bold text-green-500">{acceptedOffers}</p>
                </div>
            </div>

            {/* Offers List or Empty State */}
            {offers.length > 0 ? (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your Offers</h2>
                    <div className="grid gap-4">
                        {offers.map((offer) => {
                            const totalCTC = offer.baseSalary + (offer.bonus || 0) + (offer.stocks || 0);
                            return (
                                <div key={offer.id} className="bg-card border rounded-xl p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{offer.company}</h3>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                                                    {offer.status}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground mb-3">{offer.role}</p>

                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    {offer.location}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                                                    <IndianRupee className="h-4 w-4" />
                                                    {formatSalary(totalCTC)} CTC
                                                </div>
                                                {offer.deadline && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Calendar className="h-4 w-4" />
                                                        Deadline: {new Date(offer.deadline).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Salary Breakdown */}
                                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Base Salary</p>
                                            <p className="font-medium">{formatSalary(offer.baseSalary)}</p>
                                        </div>
                                        {offer.bonus && (
                                            <div>
                                                <p className="text-muted-foreground">Bonus</p>
                                                <p className="font-medium">{formatSalary(offer.bonus)}</p>
                                            </div>
                                        )}
                                        {offer.stocks && (
                                            <div>
                                                <p className="text-muted-foreground">Stocks/RSU</p>
                                                <p className="font-medium">{formatSalary(offer.stocks)}</p>
                                            </div>
                                        )}
                                    </div>

                                    {offer.notes && (
                                        <p className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                                            {offer.notes}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
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
            )}

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

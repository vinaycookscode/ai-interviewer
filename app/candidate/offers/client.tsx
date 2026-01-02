"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    BriefcaseBusiness, Plus, IndianRupee, MapPin, Calendar,
    Check, X, Edit, Trash2, FileText, TrendingUp, Award,
    ChevronDown, MoreVertical, Scale, Sparkles, Upload
} from "lucide-react";
import { updateOfferStatus, deleteOffer } from "@/actions/job-offers";

interface Offer {
    id: string;
    company: string;
    role: string;
    location: string;
    baseSalary: number;
    bonus: number | null;
    stocks: number | null;
    deadline: Date | null;
    joiningDate: Date | null;
    offerLetterUrl: string | null;
    status: string;
    notes: string | null;
    createdAt: Date;
}

interface OffersClientProps {
    offers: Offer[];
}

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
        case "NEGOTIATING": return "text-blue-500 bg-blue-500/10";
        default: return "text-yellow-500 bg-yellow-500/10";
    }
}

function getBestOfferInsights(offers: Offer[]) {
    if (offers.length === 0) return null;

    const withTotals = offers.map(o => ({
        ...o,
        totalCTC: o.baseSalary + (o.bonus || 0) + (o.stocks || 0)
    }));

    const bestSalary = withTotals.reduce((max, o) => o.totalCTC > max.totalCTC ? o : max, withTotals[0]);
    const pendingOffers = withTotals.filter(o => o.status === "PENDING");
    const nextDeadline = pendingOffers
        .filter(o => o.deadline)
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0];

    return { bestSalary, nextDeadline, pendingOffers };
}

export function OffersClient({ offers }: OffersClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    const totalOffers = offers.length;
    const pendingOffers = offers.filter(o => o.status === "PENDING").length;
    const acceptedOffers = offers.filter(o => o.status === "ACCEPTED").length;

    const insights = getBestOfferInsights(offers);

    const handleStatusChange = async (offerId: string, status: string) => {
        startTransition(async () => {
            await updateOfferStatus(offerId, status);
            setShowActionsFor(null);
            router.refresh();
        });
    };

    const handleDelete = async (offerId: string) => {
        if (!confirm("Are you sure you want to delete this offer?")) return;
        startTransition(async () => {
            await deleteOffer(offerId);
            router.refresh();
        });
    };

    // Calculate comparison data
    const comparisonData = offers.map(o => ({
        ...o,
        totalCTC: o.baseSalary + (o.bonus || 0) + (o.stocks || 0)
    })).sort((a, b) => b.totalCTC - a.totalCTC);

    const maxCTC = comparisonData[0]?.totalCTC || 1;

    return (
        <div className="space-y-6">
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

            {/* Feature Cards - Now at top */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                            <IndianRupee className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold">Salary Comparison</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                        Compare base salary, bonuses, and total compensation
                    </p>
                    {offers.length >= 2 && (
                        <button
                            onClick={() => setShowComparison(!showComparison)}
                            className="text-sm text-emerald-500 hover:text-emerald-400 font-medium"
                        >
                            {showComparison ? "Hide Comparison" : "View Comparison →"}
                        </button>
                    )}
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold">Location Analysis</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Adjust for cost of living in different cities
                    </p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-500 rounded-lg">
                            <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold">Deadline Tracking</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Never miss an offer deadline with smart reminders
                    </p>
                    {insights?.nextDeadline && (
                        <p className="text-sm text-orange-500 mt-2 font-medium">
                            Next: {insights.nextDeadline.company} - {new Date(insights.nextDeadline.deadline!).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>

            {/* AI Recommended Best Offer */}
            {insights && offers.length >= 2 && (
                <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/20 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Best Offer Recommendation</h3>
                            <p className="text-sm text-muted-foreground">Based on total compensation</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <p className="text-lg font-bold flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-500" />
                                {insights.bestSalary.company} - {insights.bestSalary.role}
                            </p>
                            <p className="text-2xl font-bold text-emerald-500">
                                {formatSalary(insights.bestSalary.totalCTC)} CTC
                            </p>
                        </div>
                        {insights.bestSalary.status === "PENDING" && (
                            <button
                                onClick={() => handleStatusChange(insights.bestSalary.id, "ACCEPTED")}
                                disabled={isPending}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                            >
                                Accept This Offer
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Comparison View */}
            {showComparison && offers.length >= 2 && (
                <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        Offer Comparison
                    </h3>
                    <div className="space-y-4">
                        {comparisonData.map((offer, index) => (
                            <div key={offer.id} className="flex items-center gap-4">
                                <div className="w-32 shrink-0">
                                    <p className="font-medium truncate">{offer.company}</p>
                                    <p className="text-xs text-muted-foreground">{offer.role}</p>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-8 bg-gradient-to-r from-emerald-500 to-green-400 rounded transition-all"
                                            style={{ width: `${(offer.totalCTC / maxCTC) * 100}%` }}
                                        />
                                        <span className="text-sm font-medium whitespace-nowrap">
                                            {formatSalary(offer.totalCTC)}
                                        </span>
                                        {index === 0 && (
                                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full font-medium">
                                                BEST
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                                <div key={offer.id} className="bg-card border rounded-xl p-6 relative">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">{offer.company}</h3>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                                                    {offer.status}
                                                </span>
                                                {offer.offerLetterUrl && (
                                                    <a
                                                        href={offer.offerLetterUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-400"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </a>
                                                )}
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

                                        {/* Actions Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowActionsFor(showActionsFor === offer.id ? null : offer.id)}
                                                className="p-2 hover:bg-muted rounded-lg"
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>

                                            {showActionsFor === offer.id && (
                                                <div className="absolute right-0 top-10 w-48 bg-popover border rounded-lg shadow-lg z-10 py-1">
                                                    {offer.status === "PENDING" && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusChange(offer.id, "ACCEPTED")}
                                                                disabled={isPending}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-green-500"
                                                            >
                                                                <Check className="h-4 w-4" />
                                                                Accept Offer
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(offer.id, "REJECTED")}
                                                                disabled={isPending}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Decline Offer
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(offer.id, "NEGOTIATING")}
                                                                disabled={isPending}
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-blue-500"
                                                            >
                                                                <TrendingUp className="h-4 w-4" />
                                                                Negotiating
                                                            </button>
                                                            <div className="border-t my-1" />
                                                        </>
                                                    )}
                                                    <Link
                                                        href={`/candidate/offers/${offer.id}/edit`}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Edit Offer
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(offer.id)}
                                                        disabled={isPending}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
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
        </div>
    );
}

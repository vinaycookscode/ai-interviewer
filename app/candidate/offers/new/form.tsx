"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOffer } from "@/actions/job-offers";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export function AddOfferForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await createOffer({
                company: formData.get("company") as string,
                role: formData.get("role") as string,
                location: formData.get("location") as string,
                baseSalary: parseFloat(formData.get("baseSalary") as string) || 0,
                bonus: parseFloat(formData.get("bonus") as string) || undefined,
                stocks: parseFloat(formData.get("stocks") as string) || undefined,
                joiningDate: formData.get("joiningDate") ? new Date(formData.get("joiningDate") as string) : undefined,
                deadline: formData.get("deadline") ? new Date(formData.get("deadline") as string) : undefined,
                notes: formData.get("notes") as string || undefined,
            });

            if (result.error) {
                setError(result.error);
            } else {
                router.push("/candidate/offers");
                router.refresh();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Link
                href="/candidate/offers"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Offers
            </Link>

            {error && (
                <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-card border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-lg mb-4">Company Details</h2>

                <div>
                    <label className="block text-sm font-medium mb-2">Company Name *</label>
                    <input
                        name="company"
                        type="text"
                        required
                        placeholder="e.g., Google, TCS, Amazon"
                        className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Role *</label>
                    <input
                        name="role"
                        type="text"
                        required
                        placeholder="e.g., Software Engineer, SDE-1"
                        className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Location *</label>
                    <input
                        name="location"
                        type="text"
                        required
                        placeholder="e.g., Bangalore, Hyderabad, Remote"
                        className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-lg mb-4">Compensation</h2>

                <div>
                    <label className="block text-sm font-medium mb-2">Base Salary (Annual) *</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <input
                            name="baseSalary"
                            type="number"
                            required
                            min="0"
                            step="1000"
                            placeholder="e.g., 1200000"
                            className="w-full pl-8 pr-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Bonus (Annual)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <input
                                name="bonus"
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="e.g., 100000"
                                className="w-full pl-8 pr-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Stocks/RSUs (Annual)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <input
                                name="stocks"
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="e.g., 500000"
                                className="w-full pl-8 pr-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-4">
                <h2 className="font-semibold text-lg mb-4">Important Dates</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Decision Deadline</label>
                        <input
                            name="deadline"
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Expected Joining Date</label>
                        <input
                            name="joiningDate"
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0]}
                            className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-card border rounded-xl p-6">
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                    name="notes"
                    rows={3}
                    placeholder="Any additional notes about this offer..."
                    className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
            </div>

            <div className="flex gap-4">
                <Link
                    href="/candidate/offers"
                    className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg text-center hover:bg-muted/80 transition-colors font-medium"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
                >
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isPending ? "Saving..." : "Add Offer"}
                </button>
            </div>
        </form>
    );
}

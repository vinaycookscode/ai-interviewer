"use client";

import { useLimit } from "@/components/providers/limit-provider";
import { AlertCircle, X } from "lucide-react";

export function RateLimitBanner() {
    const { isRateLimited, setRateLimited } = useLimit();

    if (!isRateLimited) return null;

    return (
        <div className="bg-red-500 text-white px-4 py-3 shadow-md relative z-50 transition-all animate-in slide-in-from-top duration-300">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <p className="font-medium text-sm md:text-base">
                        AI Usage Limit Reached: We are requesting high traffic. Please try again in usually a minute.
                    </p>
                </div>
                <button
                    onClick={() => setRateLimited(false)}
                    className="p-1 hover:bg-red-600 rounded-full transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

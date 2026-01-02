"use client";

import { useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function SeedPlacementButton() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSeed = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/seed-placement", {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Seeding failed");
            }

            setResult(data.results);
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <button
                onClick={handleSeed}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Seeding..." : "Seed Database"}
            </button>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 text-red-500 rounded-lg">
                    <XCircle className="h-5 w-5" />
                    <span>{error}</span>
                </div>
            )}

            {result && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Seeding Complete!</span>
                    </div>

                    <div className="bg-card border rounded-lg p-4 space-y-3">
                        <div>
                            <h3 className="font-medium">Feature Flags</h3>
                            <pre className="text-sm text-muted-foreground">
                                {JSON.stringify(result.flags, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h3 className="font-medium">Placement Program</h3>
                            <pre className="text-sm text-muted-foreground">
                                {JSON.stringify(result.program, null, 2)}
                            </pre>
                        </div>
                        <div>
                            <h3 className="font-medium">Company Prep Kits</h3>
                            <pre className="text-sm text-muted-foreground">
                                {JSON.stringify(result.companies, null, 2)}
                            </pre>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <a
                            href="/candidate/placement-program"
                            className="text-primary hover:underline"
                        >
                            → View Placement Program
                        </a>
                        <a
                            href="/candidate/company-prep"
                            className="text-primary hover:underline"
                        >
                            → View Company Prep
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

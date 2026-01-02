import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { GraduationCap, ArrowRight, Calendar, Flame, Trophy } from "lucide-react";
import Link from "next/link";

export default async function PlacementProgramPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.PLACEMENT_PROGRAM);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 rounded-2xl p-8 border">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-500 rounded-xl">
                        <GraduationCap className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold mb-2">90-Day Placement Program</h1>
                        <p className="text-muted-foreground text-lg mb-4">
                            A structured curriculum to get you placement-ready in 90 days
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-orange-500" />
                                <span>90 Days</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span>Daily Tasks</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-orange-500" />
                                <span>Streak Rewards</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon Card */}
            <div className="bg-card border rounded-xl p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className="h-8 w-8 text-orange-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Enrollment Opening Soon</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We're putting the finishing touches on our comprehensive placement program.
                    Join the waitlist to be notified when enrollment opens.
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
                    Join Waitlist
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>

            {/* What to Expect */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-2">📚 Daily Tasks</h3>
                    <p className="text-sm text-muted-foreground">
                        Structured daily tasks including DSA problems, aptitude, and behavioral prep
                    </p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-2">🔥 Streak System</h3>
                    <p className="text-sm text-muted-foreground">
                        Build consistency with our streak system. Don't break the chain!
                    </p>
                </div>
                <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-2">📊 Progress Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                        See your improvement over time with detailed analytics
                    </p>
                </div>
            </div>
        </div>
    );
}

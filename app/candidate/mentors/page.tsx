import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { UserCheck, Search, Filter, Briefcase, GraduationCap } from "lucide-react";

export default async function MentorsPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.MENTOR_MATCHING);
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
            <div>
                <h1 className="text-3xl font-bold mb-2">Find Mentors</h1>
                <p className="text-muted-foreground">
                    Connect with placed seniors who've been where you want to go
                </p>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by company, role, or skills..."
                        className="w-full pl-10 pr-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-card border rounded-lg hover:bg-muted transition-colors">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            {/* Empty State */}
            <div className="bg-card border rounded-xl p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                    <UserCheck className="h-8 w-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Mentors Coming Soon</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    We're onboarding mentors from top companies.
                    Soon you'll be able to connect with seniors who recently got placed.
                </p>
                <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span>Industry Experts</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>Recent Graduates</span>
                    </div>
                </div>
            </div>

            {/* Become a Mentor CTA */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-6 border flex items-center justify-between">
                <div>
                    <h3 className="font-semibold mb-1">Already placed? Become a Mentor!</h3>
                    <p className="text-sm text-muted-foreground">
                        Help others succeed and build your professional network
                    </p>
                </div>
                <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium">
                    Apply as Mentor
                </button>
            </div>
        </div>
    );
}

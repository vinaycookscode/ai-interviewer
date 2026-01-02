import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { Users, Plus, Search, Trophy, Flame } from "lucide-react";

export default async function StudySquadPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.STUDY_SQUAD);
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
                    <h1 className="text-3xl font-bold mb-2">Study Squad</h1>
                    <p className="text-muted-foreground">
                        Join a peer group for accountability and growth
                    </p>
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium">
                    <Plus className="h-4 w-4" />
                    Create Squad
                </button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-pink-500/10 rounded-lg">
                        <Users className="h-6 w-6 text-pink-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">My Squads</p>
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                        <Flame className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">Day Streak</p>
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">Total Points</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Find a squad to join..."
                    className="w-full pl-10 pr-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Empty State */}
            <div className="bg-card border rounded-xl p-12 text-center">
                <div className="mx-auto w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-pink-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No Squads Yet</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create or join a study squad to collaborate with peers,
                    stay accountable, and climb the leaderboard together.
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium">
                    <Plus className="h-4 w-4" />
                    Create Your First Squad
                </button>
            </div>
        </div>
    );
}

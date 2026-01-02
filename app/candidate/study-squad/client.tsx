"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, Trophy, Flame, X, Loader2 } from "lucide-react";
import { createSquad, joinSquad } from "@/actions/study-squad";
import { cn } from "@/lib/utils";

interface StudySquadClientProps {
    userSquads: any[];
    publicSquads: any[];
}

export function StudySquadClient({ userSquads, publicSquads }: StudySquadClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleCreateSquad = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = await createSquad({
                name: formData.get("name") as string,
                description: formData.get("description") as string || undefined,
                targetRole: formData.get("targetRole") as string || undefined,
                isPublic: formData.get("isPublic") === "on",
            });

            if (result.error) {
                setError(result.error);
            } else {
                setShowCreateModal(false);
                router.refresh();
            }
        });
    };

    const handleJoinSquad = async (squadId: string) => {
        startTransition(async () => {
            const result = await joinSquad(squadId);
            if (result.error) {
                setError(result.error);
            } else {
                router.refresh();
            }
        });
    };

    // Calculate stats
    const mySquadsCount = userSquads.length;
    const totalPoints = userSquads.reduce((sum, m) => sum + (m.totalPoints || 0), 0);

    // Filter public squads by search
    const filteredSquads = publicSquads.filter(squad =>
        squad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        squad.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Create Squad
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-6 flex items-center gap-4">
                    <div className="p-3 bg-pink-500/10 rounded-lg">
                        <Users className="h-6 w-6 text-pink-500" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{mySquadsCount}</p>
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
                        <p className="text-2xl font-bold">{totalPoints}</p>
                        <p className="text-sm text-muted-foreground">Total Points</p>
                    </div>
                </div>
            </div>

            {/* My Squads */}
            {userSquads.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">My Squads</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {userSquads.map((membership) => (
                            <div key={membership.squad.id} className="bg-card border rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-pink-500/10 rounded-lg">
                                        <Users className="h-5 w-5 text-pink-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{membership.squad.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {membership.squad._count.members} members
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Find a squad to join..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Public Squads or Empty State */}
            {filteredSquads.length > 0 ? (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Public Squads</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {filteredSquads.map((squad) => (
                            <div key={squad.id} className="bg-card border rounded-xl p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-500/10 rounded-lg">
                                            <Users className="h-5 w-5 text-pink-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{squad.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {squad._count.members} members
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleJoinSquad(squad.id)}
                                        disabled={isPending}
                                        className="px-3 py-1 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 disabled:opacity-50"
                                    >
                                        Join
                                    </button>
                                </div>
                                {squad.description && (
                                    <p className="text-sm text-muted-foreground">{squad.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : mySquadsCount === 0 ? (
                <div className="bg-card border rounded-xl p-12 text-center">
                    <div className="mx-auto w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-pink-500" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">No Squads Yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create or join a study squad to collaborate with peers,
                        stay accountable, and climb the leaderboard together.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Create Your First Squad
                    </button>
                </div>
            ) : null}

            {/* Create Squad Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card border rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">Create Squad</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-muted rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSquad} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Squad Name *</label>
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="e.g., TCS Prep Warriors"
                                    className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    placeholder="What's this squad about?"
                                    className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Target Role</label>
                                <input
                                    name="targetRole"
                                    type="text"
                                    placeholder="e.g., Software Engineer"
                                    className="w-full px-4 py-2 bg-muted border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    name="isPublic"
                                    type="checkbox"
                                    id="isPublic"
                                    className="w-4 h-4 accent-pink-500"
                                />
                                <label htmlFor="isPublic" className="text-sm">
                                    Make this squad public (others can join)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50"
                                >
                                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Create Squad
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

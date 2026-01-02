"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    GraduationCap,
    ArrowRight,
    Calendar,
    Flame,
    Trophy,
    Rocket,
    BookOpen,
    Users,
    Target
} from "lucide-react";
import { ProgramCard } from "@/components/placement/program-card";
import { StreakCounter, StreakBadges } from "@/components/placement/streak-counter";
import { enrollInProgram } from "@/actions/placement-program";
import { cn } from "@/lib/utils";

interface Program {
    id: string;
    name: string;
    slug: string;
    description: string;
    durationDays: number;
    isActive: boolean;
    _count: {
        enrollments: number;
        modules: number;
    };
}

interface Enrollment {
    id: string;
    programId: string;
    currentDay: number;
    status: string;
    streak: number;
    longestStreak: number;
    program: {
        id: string;
        name: string;
        slug: string;
        durationDays: number;
    };
}

interface PlacementProgramClientProps {
    programs: Program[];
    enrollments: any[]; // Use any for flexibility with Prisma types
    enrollmentsByProgram: Record<string, any>;
}

export function PlacementProgramClient({
    programs,
    enrollments,
    enrollmentsByProgram
}: PlacementProgramClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [enrollingId, setEnrollingId] = useState<string | null>(null);

    const activeEnrollment = enrollments.find(e => e.status === "ACTIVE");

    const handleEnroll = async (programId: string) => {
        setEnrollingId(programId);
        startTransition(async () => {
            const result = await enrollInProgram(programId);
            if (result.success) {
                router.refresh();
            }
            setEnrollingId(null);
        });
    };

    const handleContinue = (programSlug: string, enrollmentId: string) => {
        router.push(`/candidate/placement-program/${programSlug}`);
    };

    return (
        <div className="space-y-8">
            {/* Active Enrollment Hero */}
            {activeEnrollment && (
                <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 rounded-2xl p-6 border border-orange-500/20">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-orange-500 mb-2">
                                <Rocket className="h-4 w-4" />
                                <span className="text-sm font-medium">Your Active Program</span>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">{activeEnrollment.program.name}</h2>
                            <p className="text-muted-foreground mb-4">
                                Day {activeEnrollment.currentDay} of {activeEnrollment.program.durationDays}
                            </p>

                            {/* Progress Bar */}
                            <div className="mb-4">
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
                                        style={{ width: `${(activeEnrollment.currentDay / activeEnrollment.program.durationDays) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <Link
                                href={`/candidate/placement-program/${activeEnrollment.program.slug}`}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                            >
                                Continue Day {activeEnrollment.currentDay}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        <div className="md:w-64">
                            <StreakCounter
                                currentStreak={activeEnrollment.streak}
                                longestStreak={activeEnrollment.longestStreak}
                                size="md"
                                showDetails
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2">Placement Programs</h1>
                <p className="text-muted-foreground">
                    Structured learning paths to get you placement-ready
                </p>
            </div>

            {/* Program Benefits */}
            {!activeEnrollment && (
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Calendar className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-medium">Daily Tasks</p>
                            <p className="text-sm text-muted-foreground">Structured daily curriculum</p>
                        </div>
                    </div>
                    <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Flame className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-medium">Streak System</p>
                            <p className="text-sm text-muted-foreground">Stay motivated daily</p>
                        </div>
                    </div>
                    <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <BookOpen className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-medium">Complete Coverage</p>
                            <p className="text-sm text-muted-foreground">DSA, Aptitude, HR</p>
                        </div>
                    </div>
                    <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Target className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-medium">Progress Tracking</p>
                            <p className="text-sm text-muted-foreground">See your improvement</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Available Programs */}
            <div>
                <h2 className="text-xl font-semibold mb-4">
                    {activeEnrollment ? "All Programs" : "Start Your Journey"}
                </h2>

                {programs.length === 0 ? (
                    <div className="bg-card border rounded-xl p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
                            <GraduationCap className="h-8 w-8 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Programs Available</h3>
                        <p className="text-muted-foreground">
                            Check back soon! We're preparing structured programs for you.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {programs.map((program) => {
                            const enrollment = enrollmentsByProgram[program.id];
                            const isEnrolled = !!enrollment;

                            return (
                                <ProgramCard
                                    key={program.id}
                                    id={program.id}
                                    name={program.name}
                                    slug={program.slug}
                                    description={program.description}
                                    durationDays={program.durationDays}
                                    enrollmentCount={program._count.enrollments}
                                    moduleCount={program._count.modules}
                                    isEnrolled={isEnrolled}
                                    currentDay={enrollment?.currentDay}
                                    streak={enrollment?.streak}
                                    onEnroll={() => handleEnroll(program.id)}
                                    onContinue={() => handleContinue(program.slug, enrollment?.id)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Streak Badges (if enrolled) */}
            {activeEnrollment && (
                <div className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Your Badges</h3>
                    <StreakBadges streak={activeEnrollment.longestStreak} />
                </div>
            )}
        </div>
    );
}

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { EnrollmentStatus, TaskType } from "@prisma/client";

// ============================================
// PROGRAM QUERIES
// ============================================

export async function getActivePrograms() {
    return db.placementProgram.findMany({
        where: { isActive: true },
        include: {
            _count: {
                select: { enrollments: true, modules: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function getProgramBySlug(slug: string) {
    return db.placementProgram.findUnique({
        where: { slug },
        include: {
            modules: {
                include: {
                    tasks: {
                        orderBy: { order: "asc" }
                    }
                },
                orderBy: { dayNumber: "asc" }
            },
            _count: {
                select: { enrollments: true }
            }
        }
    });
}

export async function getUserEnrollment(programId: string, userId: string) {
    return db.programEnrollment.findUnique({
        where: {
            userId_programId: { userId, programId }
        },
        include: {
            program: true,
            completions: {
                include: { task: true }
            }
        }
    });
}

export async function getUserEnrollments(userId: string) {
    return db.programEnrollment.findMany({
        where: { userId },
        include: {
            program: true,
            completions: true
        },
        orderBy: { createdAt: "desc" }
    });
}

// ============================================
// ENROLLMENT ACTIONS
// ============================================

export async function enrollInProgram(programId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Check if already enrolled
    const existing = await db.programEnrollment.findUnique({
        where: {
            userId_programId: {
                userId: session.user.id,
                programId
            }
        }
    });

    if (existing) {
        return { error: "Already enrolled in this program" };
    }

    // Create enrollment
    const enrollment = await db.programEnrollment.create({
        data: {
            userId: session.user.id,
            programId,
            status: EnrollmentStatus.ACTIVE,
            currentDay: 1,
            streak: 0,
            longestStreak: 0
        }
    });

    revalidatePath("/candidate/placement-program");
    return { success: true, enrollment };
}

export async function pauseEnrollment(enrollmentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId: session.user.id }
    });

    if (!enrollment) {
        return { error: "Enrollment not found" };
    }

    await db.programEnrollment.update({
        where: { id: enrollmentId },
        data: { status: EnrollmentStatus.PAUSED }
    });

    revalidatePath("/candidate/placement-program");
    return { success: true };
}

export async function resumeEnrollment(enrollmentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    await db.programEnrollment.update({
        where: { id: enrollmentId },
        data: { status: EnrollmentStatus.ACTIVE }
    });

    revalidatePath("/candidate/placement-program");
    return { success: true };
}

// ============================================
// TASK COMPLETION
// ============================================

export async function startTask(enrollmentId: string, taskId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Verify ownership
    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId: session.user.id }
    });

    if (!enrollment) {
        return { error: "Enrollment not found" };
    }

    // Check if already started
    const existing = await db.taskCompletion.findUnique({
        where: {
            enrollmentId_taskId: { enrollmentId, taskId }
        }
    });

    if (existing) {
        // Already started, just return it
        return { success: true, completion: existing };
    }

    // Create started task (not completed yet)
    const completion = await db.taskCompletion.create({
        data: {
            enrollmentId,
            taskId,
            startedAt: new Date(),
            completedAt: null,
            score: null
        }
    });

    revalidatePath("/candidate/placement-program");
    return { success: true, completion };
}

export async function completeTask(enrollmentId: string, taskId: string, score?: number, metadata?: any) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Verify ownership
    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId: session.user.id }
    });

    if (!enrollment) {
        return { error: "Enrollment not found" };
    }

    // Check if already completed
    const existing = await db.taskCompletion.findUnique({
        where: {
            enrollmentId_taskId: { enrollmentId, taskId }
        }
    });

    if (existing?.completedAt) {
        return { error: "Task already completed" };
    }

    // Upsert - update if started, create if not
    const completion = await db.taskCompletion.upsert({
        where: {
            enrollmentId_taskId: { enrollmentId, taskId }
        },
        create: {
            enrollmentId,
            taskId,
            startedAt: new Date(),
            completedAt: new Date(),
            score
        },
        update: {
            completedAt: new Date(),
            score,
            timeSpent: existing ? Math.round((Date.now() - existing.startedAt.getTime()) / 60000) : null,
            metadata: metadata ?? undefined
        }
    });

    // Update streak logic
    await updateStreak(enrollmentId);

    revalidatePath("/candidate/placement-program");
    return { success: true, completion };
}

async function updateStreak(enrollmentId: string) {
    const enrollment = await db.programEnrollment.findUnique({
        where: { id: enrollmentId }
    });

    if (!enrollment) return;

    const now = new Date();
    const lastActive = enrollment.lastActiveAt;
    const daysSinceLastActive = Math.floor(
        (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newStreak = enrollment.streak;

    if (daysSinceLastActive === 0) {
        // Same day, no streak change
    } else if (daysSinceLastActive === 1) {
        // Consecutive day, increment streak
        newStreak = enrollment.streak + 1;
    } else {
        // Streak broken
        newStreak = 1;
    }

    const newLongestStreak = Math.max(newStreak, enrollment.longestStreak);

    await db.programEnrollment.update({
        where: { id: enrollmentId },
        data: {
            streak: newStreak,
            longestStreak: newLongestStreak,
            lastActiveAt: now
        }
    });
}

// ============================================
// PROGRESS & ANALYTICS
// ============================================

export async function getEnrollmentProgress(enrollmentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId: session.user.id },
        include: {
            program: {
                include: {
                    modules: {
                        include: {
                            tasks: true
                        }
                    }
                }
            },
            completions: true
        }
    });

    if (!enrollment) return null;

    const totalTasks = enrollment.program.modules.reduce(
        (sum, module) => sum + module.tasks.length,
        0
    );
    const completedTasks = enrollment.completions.length;
    const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get tasks by type
    const tasksByType: Record<string, { total: number; completed: number }> = {};

    for (const module of enrollment.program.modules) {
        for (const task of module.tasks) {
            if (!tasksByType[task.type]) {
                tasksByType[task.type] = { total: 0, completed: 0 };
            }
            tasksByType[task.type].total++;

            if (enrollment.completions.some(c => c.taskId === task.id)) {
                tasksByType[task.type].completed++;
            }
        }
    }

    return {
        enrollment,
        totalTasks,
        completedTasks,
        progressPercent,
        tasksByType,
        currentDay: enrollment.currentDay,
        streak: enrollment.streak,
        longestStreak: enrollment.longestStreak
    };
}

export async function getDayTasks(enrollmentId: string, dayNumber: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    // 1. Get Enrollment & Completions
    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId: session.user.id },
        include: {
            completions: {
                include: { task: true }
            }
        }
    });

    if (!enrollment) return null;

    // 2. Fetch the specific Module directly
    // This ensures we get the latest content and avoids deep nesting issues
    const module = await db.programModule.findUnique({
        where: {
            programId_dayNumber: {
                programId: enrollment.programId,
                dayNumber: dayNumber
            }
        },
        include: {
            tasks: {
                orderBy: { order: "asc" }
            }
        }
    });

    if (!module) {
        return null;
    }

    // Create a map of task completions for quick lookup
    const completionMap = new Map(
        enrollment.completions.map(c => [c.taskId, c])
    );

    return {
        module,
        tasks: module.tasks.map(task => {
            const completion = completionMap.get(task.id);
            return {
                ...task,
                isStarted: !!completion,
                isCompleted: !!completion?.completedAt,
                score: completion?.score ?? null,
                timeSpent: completion?.timeSpent ?? null,
                metadata: completion?.metadata ?? null
            };
        }),
        allCompleted: module.tasks.every(task => {
            const completion = completionMap.get(task.id);
            return !!completion?.completedAt;
        })
    };
}

// ============================================
// ADVANCE DAY
// ============================================

export async function advanceToNextDay(enrollmentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId: session.user.id },
        include: {
            program: true
        }
    });

    if (!enrollment) {
        return { error: "Enrollment not found" };
    }

    if (enrollment.currentDay >= enrollment.program.durationDays) {
        // Program complete!
        await db.programEnrollment.update({
            where: { id: enrollmentId },
            data: { status: EnrollmentStatus.COMPLETED }
        });
        return { success: true, completed: true };
    }

    await db.programEnrollment.update({
        where: { id: enrollmentId },
        data: { currentDay: enrollment.currentDay + 1 }
    });

    revalidatePath("/candidate/placement-program");
    return { success: true, newDay: enrollment.currentDay + 1 };
}

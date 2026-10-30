"use server";

import { db } from "@/lib/db";
import { issueCertificate } from "@/lib/achievements/server";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { EnrollmentStatus, TaskType } from "@prisma/client";
import { generateDayToken } from "@/lib/day-token";
import { istDay, startOfIstDay } from "@/lib/ist";
import { checkpointTopics, markPlanActive } from "@/lib/plan/server";
import { isCheckpointDay } from "@/lib/plan/checkpoints";
import { ROLE_NAMES } from "@/lib/career-path";

// ============================================
// PROGRAM QUERIES
// ============================================

// Pages read programs and enrollments directly, scoped to the signed-in user (AIIN-134).
// The old getUserEnrollment(s) actions took a user id from the caller and are gone.

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

    // Only the user's own enrollment (AIIN-134)
    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId: session.user.id }
    });
    if (!enrollment) {
        return { error: "Enrollment not found" };
    }

    // A pause keeps the streak: count the plan as last active yesterday at the latest, so today's task continues it.
    const yesterday = startOfIstDay(istDay(new Date()) - 1);
    await db.programEnrollment.update({
        where: { id: enrollmentId },
        data: {
            status: EnrollmentStatus.ACTIVE,
            lastActiveAt: enrollment.lastActiveAt > yesterday ? enrollment.lastActiveAt : yesterday
        }
    });

    revalidatePath("/candidate/placement-program");
    return { success: true };
}

// ============================================
// TASK COMPLETION
// ============================================

/**
 * True if the user owns the enrollment and the task belongs to its program
 * on a day the user has already unlocked.
 */
async function canAccessTask(userId: string, enrollmentId: string, taskId: string) {
    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId },
        select: { programId: true, currentDay: true }
    });

    if (!enrollment) return false;

    const task = await db.dailyTask.findFirst({
        where: {
            id: taskId,
            module: { programId: enrollment.programId, dayNumber: { lte: enrollment.currentDay } }
        },
        select: { id: true }
    });

    return task !== null;
}

export async function startTask(enrollmentId: string, taskId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    if (!(await canAccessTask(session.user.id, enrollmentId, taskId))) {
        return { error: "Task not found" };
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

    if (!(await canAccessTask(session.user.id, enrollmentId, taskId))) {
        return { error: "Task not found" };
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

    await markPlanActive(session.user.id, enrollmentId);

    revalidatePath("/candidate/placement-program");
    return { success: true, completion };
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
            user: {
                include: { candidateProfile: true }
            },
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

    // 3. Get User Profile for filtering
    const userRole = enrollment.user.candidateProfile?.primaryRole;

    // Create a map of task completions for quick lookup
    const completionMap = new Map(
        enrollment.completions.map(c => [c.taskId, c])
    );

    // 4. Filter tasks by role
    const filteredTasks = (module?.tasks || []).filter((task: any) => {
        if (!task.role) return true; // Common task
        if (!userRole) return true;  // No profile yet, show everything
        return task.role === userRole;
    });

    return {
        module,
        tasks: filteredTasks.map((task: any) => {
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
        allCompleted: filteredTasks.every((task: any) => {
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
        await issueCertificate(enrollmentId);
        return { success: true, completed: true };
    }

    await db.programEnrollment.update({
        where: { id: enrollmentId },
        data: { currentDay: enrollment.currentDay + 1 }
    });

    const newDay = enrollment.currentDay + 1;
    const newDayToken = generateDayToken(enrollmentId, newDay);

    revalidatePath("/candidate/placement-program");
    return { success: true, newDay, newDayToken };
}

// ============================================
// CHECKPOINTS (AIIN-101)
// ============================================

/**
 * Opens the day 30, 60 or 90 checkpoint: a practice interview on that phase's topics, one per plan and day.
 * Returns the same interview if it's already started, so it can be continued. Doesn't count towards the practice limit.
 */
export async function startCheckpoint(enrollmentId: string, day: number) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { error: "unauthorized" as const };

    const enrollment = await db.programEnrollment.findFirst({
        where: { id: enrollmentId, userId },
        select: { status: true, currentDay: true, programId: true, program: { select: { durationDays: true } } },
    });
    if (!enrollment || !Number.isInteger(day) || !isCheckpointDay(day, enrollment.program.durationDays) || day > enrollment.currentDay) {
        return { error: "notFound" as const };
    }

    const existing = await db.mockInterview.findUnique({ where: { enrollmentId_checkpointDay: { enrollmentId, checkpointDay: day } }, select: { id: true } });
    if (existing) return { mockInterviewId: existing.id };
    if (enrollment.status === "PAUSED") return { error: "paused" as const };

    const profile = await db.candidateProfile.findUnique({ where: { userId }, select: { primaryRole: true } });
    try {
        const created = await db.mockInterview.create({
            data: {
                userId,
                role: profile?.primaryRole || ROLE_NAMES.sde,
                difficulty: "Junior",
                topics: await checkpointTopics(enrollment.programId, day),
                enrollmentId,
                checkpointDay: day,
            },
            select: { id: true },
        });
        return { mockInterviewId: created.id };
    } catch {
        // Started in another tab at the same moment: use that one
        const raced = await db.mockInterview.findUnique({ where: { enrollmentId_checkpointDay: { enrollmentId, checkpointDay: day } }, select: { id: true } });
        return raced ? { mockInterviewId: raced.id } : { error: "failed" as const };
    }
}

"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ============================================
// SQUAD QUERIES
// ============================================

export async function getPublicSquads() {
    return db.studySquad.findMany({
        where: { isPublic: true },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, image: true } } },
                take: 5
            },
            _count: { select: { members: true, activities: true } }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function getUserSquads(userId: string) {
    return db.squadMember.findMany({
        where: { userId },
        include: {
            squad: {
                include: {
                    _count: { select: { members: true } }
                }
            }
        }
    });
}

export async function getSquadBySlug(slug: string) {
    return db.studySquad.findUnique({
        where: { slug },
        include: {
            members: {
                include: { user: { select: { id: true, name: true, image: true } } },
                orderBy: { totalPoints: "desc" }
            },
            activities: {
                orderBy: { createdAt: "desc" },
                take: 20
            }
        }
    });
}

// ============================================
// SQUAD ACTIONS
// ============================================

export async function createSquad(data: {
    name: string;
    description?: string;
    targetCompanies?: string[];
    targetRole?: string;
    isPublic?: boolean;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Generate slug
    const slug = data.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
        '-' + Date.now().toString(36);

    // Create squad
    const squad = await db.studySquad.create({
        data: {
            name: data.name,
            slug,
            description: data.description,
            targetCompanies: data.targetCompanies || [],
            targetRole: data.targetRole,
            isPublic: data.isPublic ?? false,
            members: {
                create: {
                    userId: session.user.id,
                    role: "LEADER"
                }
            }
        }
    });

    revalidatePath("/candidate/study-squad");
    return { success: true, squad };
}

export async function joinSquad(squadId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Check if squad exists and is public
    const squad = await db.studySquad.findUnique({
        where: { id: squadId },
        include: { _count: { select: { members: true } } }
    });

    if (!squad) {
        return { error: "Squad not found" };
    }

    if (!squad.isPublic) {
        return { error: "This squad is private" };
    }

    if (squad._count.members >= squad.maxMembers) {
        return { error: "Squad is full" };
    }

    // Check if already member
    const existing = await db.squadMember.findUnique({
        where: { squadId_userId: { squadId, userId: session.user.id } }
    });

    if (existing) {
        return { error: "Already a member" };
    }

    // Join squad
    await db.squadMember.create({
        data: {
            squadId,
            userId: session.user.id,
            role: "MEMBER"
        }
    });

    // Log activity
    await db.squadActivity.create({
        data: {
            squadId,
            userId: session.user.id,
            type: "JOIN",
            description: "joined the squad",
            points: 10
        }
    });

    revalidatePath("/candidate/study-squad");
    return { success: true };
}

export async function leaveSquad(squadId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    await db.squadMember.delete({
        where: { squadId_userId: { squadId, userId: session.user.id } }
    });

    revalidatePath("/candidate/study-squad");
    return { success: true };
}

// ============================================
// ACTIVITY & POINTS
// ============================================

export async function logSquadActivity(
    squadId: string,
    type: string,
    description: string,
    points: number = 0
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Create activity
    await db.squadActivity.create({
        data: {
            squadId,
            userId: session.user.id,
            type,
            description,
            points
        }
    });

    // Update member points
    await db.squadMember.update({
        where: { squadId_userId: { squadId, userId: session.user.id } },
        data: {
            totalPoints: { increment: points }
        }
    });

    revalidatePath(`/candidate/study-squad`);
    return { success: true };
}

export async function getLeaderboard(squadId: string) {
    return db.squadMember.findMany({
        where: { squadId },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { totalPoints: "desc" }
    });
}

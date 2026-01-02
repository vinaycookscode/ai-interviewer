"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ============================================
// MENTOR QUERIES
// ============================================

export async function getAvailableMentors() {
    return db.mentorProfile.findMany({
        where: { isAvailable: true },
        include: {
            user: { select: { id: true, name: true, image: true } },
            _count: { select: { mentorships: true } }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function getMentorById(mentorId: string) {
    return db.mentorProfile.findUnique({
        where: { id: mentorId },
        include: {
            user: { select: { id: true, name: true, image: true, email: true } },
            mentorships: {
                where: { status: "ACTIVE" },
                include: { mentee: { select: { id: true, name: true } } }
            }
        }
    });
}

export async function getUserMentorships(userId: string) {
    return db.mentorship.findMany({
        where: { menteeId: userId },
        include: {
            mentor: {
                include: { user: { select: { id: true, name: true, image: true } } }
            }
        }
    });
}

// ============================================
// MENTOR ACTIONS
// ============================================

export async function createMentorProfile(data: {
    company: string;
    role: string;
    experience: number;
    college?: string;
    gradYear?: number;
    bio?: string;
    linkedin?: string;
    skills: string[];
    companies: string[];
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Check if already a mentor
    const existing = await db.mentorProfile.findUnique({
        where: { userId: session.user.id }
    });

    if (existing) {
        return { error: "Already a mentor" };
    }

    const profile = await db.mentorProfile.create({
        data: {
            userId: session.user.id,
            ...data
        }
    });

    revalidatePath("/candidate/mentors");
    return { success: true, profile };
}

export async function requestMentorship(mentorId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Check if mentor exists and is available
    const mentor = await db.mentorProfile.findUnique({
        where: { id: mentorId },
        include: { _count: { select: { mentorships: { where: { status: "ACTIVE" } } } } }
    });

    if (!mentor) {
        return { error: "Mentor not found" };
    }

    if (!mentor.isAvailable) {
        return { error: "Mentor is not available" };
    }

    if (mentor._count.mentorships >= mentor.maxMentees) {
        return { error: "Mentor has reached maximum mentees" };
    }

    // Check if already has mentorship
    const existing = await db.mentorship.findUnique({
        where: { mentorId_menteeId: { mentorId, menteeId: session.user.id } }
    });

    if (existing) {
        return { error: "Already have a mentorship with this mentor" };
    }

    // Create mentorship request
    const mentorship = await db.mentorship.create({
        data: {
            mentorId,
            menteeId: session.user.id,
            status: "PENDING"
        }
    });

    revalidatePath("/candidate/mentors");
    return { success: true, mentorship };
}

export async function respondToMentorship(mentorshipId: string, accept: boolean) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Verify user is the mentor
    const mentorship = await db.mentorship.findUnique({
        where: { id: mentorshipId },
        include: { mentor: true }
    });

    if (!mentorship || mentorship.mentor.userId !== session.user.id) {
        return { error: "Not authorized" };
    }

    await db.mentorship.update({
        where: { id: mentorshipId },
        data: {
            status: accept ? "ACTIVE" : "REJECTED",
            startDate: accept ? new Date() : null
        }
    });

    revalidatePath("/candidate/mentors");
    return { success: true };
}

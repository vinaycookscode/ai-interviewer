"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";

/** Mentors is hidden until mentors are verified and can talk to mentees (AIIN-75): every action here needs the flag and a signed-in user. */
async function mentorUserId(): Promise<string | null> {
    const session = await auth();
    if (!session?.user?.id) return null;
    return (await checkFeature(FEATURES.MENTOR_MATCHING)) ? session.user.id : null;
}

// ============================================
// MENTOR QUERIES
// ============================================

export async function getAvailableMentors() {
    if (!(await mentorUserId())) return [];
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
    if (!(await mentorUserId())) return null;
    return db.mentorProfile.findUnique({
        where: { id: mentorId },
        include: {
            // Never the mentor's email: it isn't theirs to give out by default (AIIN-75)
            user: { select: { id: true, name: true, image: true } },
            mentorships: {
                where: { status: "ACTIVE" },
                include: { mentee: { select: { id: true, name: true } } }
            }
        }
    });
}

// Only ever the signed-in user's own mentorships, whatever is passed (AIIN-75)
export async function getUserMentorships(_userId?: string) {
    const userId = await mentorUserId();
    if (!userId) return [];
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
    const userId = await mentorUserId();
    if (!userId) {
        return { error: "Not available" };
    }
    const session = { user: { id: userId } };

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
    const userId = await mentorUserId();
    if (!userId) {
        return { error: "Not available" };
    }
    const session = { user: { id: userId } };

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
    const userId = await mentorUserId();
    if (!userId) {
        return { error: "Not available" };
    }
    const session = { user: { id: userId } };

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

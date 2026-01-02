"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ============================================
// JOB OFFERS QUERIES
// ============================================

export async function getUserOffers(userId: string) {
    return db.jobOffer.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
    });
}

export async function getOfferById(offerId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    return db.jobOffer.findFirst({
        where: { id: offerId, userId: session.user.id }
    });
}

// ============================================
// OFFER ACTIONS
// ============================================

export async function createOffer(data: {
    company: string;
    role: string;
    location: string;
    baseSalary: number;
    bonus?: number;
    stocks?: number;
    otherBenefits?: Record<string, any>;
    joiningDate?: Date;
    deadline?: Date;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    const offer = await db.jobOffer.create({
        data: {
            userId: session.user.id,
            company: data.company,
            role: data.role,
            location: data.location,
            baseSalary: data.baseSalary,
            bonus: data.bonus,
            stocks: data.stocks,
            otherBenefits: data.otherBenefits,
            joiningDate: data.joiningDate,
            deadline: data.deadline,
            notes: data.notes
        }
    });

    revalidatePath("/candidate/offers");
    return { success: true, offer };
}

export async function updateOfferStatus(offerId: string, status: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    await db.jobOffer.update({
        where: { id: offerId },
        data: { status }
    });

    revalidatePath("/candidate/offers");
    return { success: true };
}

export async function deleteOffer(offerId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    await db.jobOffer.delete({
        where: { id: offerId }
    });

    revalidatePath("/candidate/offers");
    return { success: true };
}

export async function updateOffer(offerId: string, data: {
    company?: string;
    role?: string;
    location?: string;
    baseSalary?: number;
    bonus?: number;
    stocks?: number;
    joiningDate?: Date;
    deadline?: Date;
    notes?: string;
    offerLetterUrl?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Verify ownership
    const existing = await db.jobOffer.findFirst({
        where: { id: offerId, userId: session.user.id }
    });

    if (!existing) {
        return { error: "Offer not found" };
    }

    await db.jobOffer.update({
        where: { id: offerId },
        data: {
            company: data.company,
            role: data.role,
            location: data.location,
            baseSalary: data.baseSalary,
            bonus: data.bonus,
            stocks: data.stocks,
            joiningDate: data.joiningDate,
            deadline: data.deadline,
            notes: data.notes,
            offerLetterUrl: data.offerLetterUrl,
        }
    });

    revalidatePath("/candidate/offers");
    return { success: true };
}

// ============================================
// COMPARISON
// ============================================

export async function compareOffers(offerIds: string[]) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const offers = await db.jobOffer.findMany({
        where: {
            id: { in: offerIds },
            userId: session.user.id
        }
    });

    // Calculate total compensation
    const withTotals = offers.map(offer => ({
        ...offer,
        totalCTC: offer.baseSalary + (offer.bonus || 0) + (offer.stocks || 0)
    }));

    return withTotals;
}

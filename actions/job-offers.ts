"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ============================================
// JOB OFFERS QUERIES
// ============================================

const OFFER_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "NEGOTIATING"];

/** An offer letter must be a file this user uploaded to their own folder in our bucket. */
function ownLetter(url: string | undefined, userId: string): string | undefined {
    const bucket = process.env.R2_PUBLIC_URL;
    return url && bucket && url.startsWith(`${bucket}/profiles/${userId}/`) ? url : undefined;
}

// The signed-in user's own offers only: server actions are public endpoints (AIIN-135).
export async function getUserOffers() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return db.jobOffer.findMany({
        where: { userId: session.user.id },
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
    offerLetterUrl?: string;
    status?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }
    if (!data.company?.trim() || !(data.baseSalary > 0)) {
        return { error: "Add the company and the base salary." };
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
            notes: data.notes,
            offerLetterUrl: ownLetter(data.offerLetterUrl, session.user.id),
            status: data.status && OFFER_STATUSES.includes(data.status) ? data.status : undefined
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

    if (!OFFER_STATUSES.includes(status)) {
        return { error: "Unknown status" };
    }

    // Only the user's own offer (AIIN-135)
    const { count } = await db.jobOffer.updateMany({
        where: { id: offerId, userId: session.user.id },
        data: { status }
    });
    if (count === 0) {
        return { error: "Offer not found" };
    }

    revalidatePath("/candidate/offers");
    return { success: true };
}

export async function deleteOffer(offerId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Not authenticated" };
    }

    // Only the user's own offer (AIIN-135)
    const { count } = await db.jobOffer.deleteMany({
        where: { id: offerId, userId: session.user.id }
    });
    if (count === 0) {
        return { error: "Offer not found" };
    }

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
    status?: string;
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
            offerLetterUrl: ownLetter(data.offerLetterUrl, session.user.id),
            status: data.status && OFFER_STATUSES.includes(data.status) ? data.status : undefined,
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

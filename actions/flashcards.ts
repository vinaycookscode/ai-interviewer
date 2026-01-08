"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Leitner box intervals (in days)
const BOX_INTERVALS = {
    1: 1,   // Review daily
    2: 2,   // Review every 2 days
    3: 4,   // Review every 4 days
    4: 8,   // Review every 8 days
    5: 16,  // Review every 16 days
};

// Get all decks (system + user's custom)
export async function getDecks() {
    const session = await auth();

    const decks = await db.flashcardDeck.findMany({
        where: {
            OR: [
                { isPublic: true },
                { userId: session?.user?.id },
            ],
        },
        include: {
            _count: {
                select: { cards: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // For each deck, get user's progress stats
    if (session?.user?.id) {
        const decksWithProgress = await Promise.all(
            decks.map(async (deck) => {
                const progress = await db.flashcardProgress.findMany({
                    where: {
                        userId: session.user!.id!,
                        card: { deckId: deck.id },
                    },
                });

                const masteredCount = progress.filter((p) => p.box >= 4).length;
                const totalCards = deck._count.cards;
                const masteryPercent = totalCards > 0
                    ? Math.round((masteredCount / totalCards) * 100)
                    : 0;

                return {
                    ...deck,
                    cardCount: totalCards,
                    masteredCount,
                    masteryPercent,
                };
            })
        );
        return decksWithProgress;
    }

    return decks.map((deck) => ({
        ...deck,
        cardCount: deck._count.cards,
        masteredCount: 0,
        masteryPercent: 0,
    }));
}

// Get single deck with cards
export async function getDeckWithCards(deckId: string) {
    const session = await auth();

    const deck = await db.flashcardDeck.findUnique({
        where: { id: deckId },
        include: {
            cards: {
                include: {
                    progress: session?.user?.id
                        ? { where: { userId: session.user.id } }
                        : false,
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    return deck;
}

// Get cards due for review (study session)
export async function getStudyCards(deckId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const now = new Date();

    // Get all cards in deck
    const cards = await db.flashcard.findMany({
        where: { deckId },
        include: {
            progress: {
                where: { userId: session.user.id },
            },
        },
    });

    // Filter to cards due for review
    const dueCards = cards.filter((card) => {
        if (card.progress.length === 0) return true; // New card
        const progress = card.progress[0];
        return new Date(progress.nextReview) <= now;
    });

    // Shuffle cards for study
    return dueCards.sort(() => Math.random() - 0.5);
}

// Update progress after user answers
export async function updateProgress(cardId: string, known: boolean) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const existing = await db.flashcardProgress.findUnique({
        where: {
            userId_cardId: {
                userId: session.user.id,
                cardId,
            },
        },
    });

    const now = new Date();
    let newBox: number;

    if (known) {
        // Move to next box (max 5)
        newBox = existing ? Math.min(existing.box + 1, 5) : 2;
    } else {
        // Reset to box 1
        newBox = 1;
    }

    const intervalDays = BOX_INTERVALS[newBox as keyof typeof BOX_INTERVALS];
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // Get the card's deckId for path revalidation
    const card = await db.flashcard.findUnique({
        where: { id: cardId },
        select: { deckId: true },
    });

    const progress = await db.flashcardProgress.upsert({
        where: {
            userId_cardId: {
                userId: session.user.id,
                cardId,
            },
        },
        update: {
            box: newBox,
            nextReview,
            lastReview: now,
            correctCount: known ? { increment: 1 } : undefined,
            incorrectCount: !known ? { increment: 1 } : undefined,
        },
        create: {
            userId: session.user.id,
            cardId,
            box: newBox,
            nextReview,
            lastReview: now,
            correctCount: known ? 1 : 0,
            incorrectCount: known ? 0 : 1,
        },
    });

    // Revalidate paths to update mastery stats
    if (card?.deckId) {
        revalidatePath(`/candidate/flashcards/${card.deckId}`);
        revalidatePath("/candidate/flashcards");
    }

    return progress;
}

// Create custom deck
export async function createDeck(name: string, description?: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const deck = await db.flashcardDeck.create({
        data: {
            name,
            description,
            category: "Custom",
            userId: session.user.id,
            isPublic: false,
        },
    });

    revalidatePath("/candidate/flashcards");
    return deck;
}

// Create card in deck
export async function createCard(deckId: string, front: string, back: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify user owns the deck
    const deck = await db.flashcardDeck.findUnique({
        where: { id: deckId },
    });

    if (!deck || (deck.userId !== session.user.id && deck.userId !== null)) {
        throw new Error("Cannot add cards to this deck");
    }

    const card = await db.flashcard.create({
        data: {
            deckId,
            front,
            back,
        },
    });

    revalidatePath(`/candidate/flashcards/${deckId}`);
    return card;
}

// Delete card
export async function deleteCard(cardId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const card = await db.flashcard.findUnique({
        where: { id: cardId },
        include: { deck: true },
    });

    if (!card || card.deck.userId !== session.user.id) {
        throw new Error("Cannot delete this card");
    }

    await db.flashcard.delete({
        where: { id: cardId },
    });

    revalidatePath(`/candidate/flashcards/${card.deckId}`);
}

// Delete deck
export async function deleteDeck(deckId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const deck = await db.flashcardDeck.findUnique({
        where: { id: deckId },
    });

    if (!deck || deck.userId !== session.user.id) {
        throw new Error("Cannot delete this deck");
    }

    await db.flashcardDeck.delete({
        where: { id: deckId },
    });

    revalidatePath("/candidate/flashcards");
}

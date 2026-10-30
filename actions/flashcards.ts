"use server";

import { db } from "@/lib/db";
import { awardAchievements } from "@/lib/achievements/server";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { istDay, startOfIstDay } from "@/lib/ist";

// Leitner box intervals (in days)
const BOX_INTERVALS = {
    1: 1,   // Review daily
    2: 2,   // Review every 2 days
    3: 4,   // Review every 4 days
    4: 8,   // Review every 8 days
    5: 16,  // Review every 16 days
};

// Decks a user may see: the shared interview-prep decks and their own (AIIN-133).
// Without a user, only shared decks: `userId: undefined` would match every deck.
function visibleDecks(userId: string | undefined) {
    return userId ? { OR: [{ isPublic: true }, { userId }] } : { isPublic: true };
}

// Get all decks (system + user's custom)
export async function getDecks() {
    const session = await auth();
    const userId = session?.user?.id;

    const decks = await db.flashcardDeck.findMany({
        where: visibleDecks(userId),
        select: {
            id: true,
            name: true,
            description: true,
            category: true,
            userId: true,
            _count: { select: { cards: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    // Mastered and not-yet-due cards for every deck in one query, counted per deck (AIIN-34)
    const masteredByDeck = new Map<string, number>();
    const waitingByDeck = new Map<string, number>();
    if (userId) {
        const now = new Date();
        const progress = await db.flashcardProgress.findMany({
            where: { userId, card: { deckId: { in: decks.map((deck) => deck.id) } } },
            select: { box: true, nextReview: true, card: { select: { deckId: true } } },
        });
        for (const { box, nextReview, card } of progress) {
            if (box >= 4) masteredByDeck.set(card.deckId, (masteredByDeck.get(card.deckId) ?? 0) + 1);
            if (nextReview > now) waitingByDeck.set(card.deckId, (waitingByDeck.get(card.deckId) ?? 0) + 1);
        }
    }

    return decks.map((deck) => {
        const totalCards = deck._count.cards;
        const masteredCount = masteredByDeck.get(deck.id) ?? 0;
        return {
            id: deck.id,
            name: deck.name,
            description: deck.description,
            category: deck.category,
            userId: deck.userId,
            cardCount: totalCards,
            masteredCount,
            // New cards and cards whose review date has come
            dueCount: userId ? totalCards - (waitingByDeck.get(deck.id) ?? 0) : 0,
            masteryPercent: totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0,
        };
    });
}

// Get a deck the user can see, with each card's progress for that user
export async function getDeckWithCards(deckId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    return db.flashcardDeck.findFirst({
        where: { id: deckId, ...visibleDecks(userId) },
        select: {
            id: true,
            name: true,
            description: true,
            category: true,
            userId: true,
            cards: {
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    front: true,
                    back: true,
                    progress: { where: { userId }, select: { box: true, nextReview: true } },
                },
            },
        },
    });
}

// Get cards due for review (study session)
export async function getStudyCards(deckId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];

    const now = new Date();

    const cards = await db.flashcard.findMany({
        where: { deckId, deck: visibleDecks(userId) },
        select: {
            id: true,
            front: true,
            back: true,
            progress: { where: { userId }, select: { nextReview: true } },
        },
    });

    // New cards, and cards whose review date has come
    const dueCards = cards.filter((card) => card.progress.length === 0 || card.progress[0].nextReview <= now);

    // Shuffle cards for study
    return dueCards.sort(() => Math.random() - 0.5);
}

// Update progress after user answers
export async function updateProgress(cardId: string, known: boolean) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Only cards in a deck this user can see (AIIN-133)
    const visible = await db.flashcard.findFirst({ where: { id: cardId, deck: visibleDecks(session.user.id) }, select: { id: true } });
    if (!visible) throw new Error("Card not found");

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

    // Due from midnight IST on the target day, so a card reviewed at 10 PM is due first thing that day (AIIN-67)
    const intervalDays = BOX_INTERVALS[newBox as keyof typeof BOX_INTERVALS];
    const nextReview = startOfIstDay(istDay(now) + intervalDays);

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

    await awardAchievements(session.user.id, ["flashcards"]);

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

    const cleanName = name.trim().slice(0, 80);
    if (!cleanName) throw new Error("A deck needs a name");

    const deck = await db.flashcardDeck.create({
        data: {
            name: cleanName,
            description: description?.trim().slice(0, 200) || null,
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

    if (!front.trim() || !back.trim()) throw new Error("A card needs a front and a back");

    // Only to your own decks: shared decks are seen by everyone (AIIN-133)
    if (!deck || deck.userId !== session.user.id) {
        throw new Error("Cannot add cards to this deck");
    }

    const card = await db.flashcard.create({
        data: {
            deckId,
            front: front.trim(),
            back: back.trim(),
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

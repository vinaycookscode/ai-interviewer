import { getStudyCards, getDeckWithCards } from "@/actions/flashcards";
import { notFound } from "next/navigation";
import { StudyClient } from "./study-client";

export default async function StudyPage({
    params,
}: {
    params: Promise<{ deckId: string }>;
}) {
    const { deckId } = await params;

    const [deck, cards] = await Promise.all([
        getDeckWithCards(deckId),
        getStudyCards(deckId),
    ]);

    if (!deck) {
        notFound();
    }

    const studyCards = cards.map((card) => ({
        id: card.id,
        front: card.front,
        back: card.back,
    }));

    return (
        <StudyClient
            deckId={deckId}
            deckName={deck.name}
            initialCards={studyCards}
        />
    );
}

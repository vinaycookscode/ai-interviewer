import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PlanTier } from "@prisma/client";
import { auth } from "@/auth";
import { getStudyCards, getDeckWithCards } from "@/actions/flashcards";
import { getCurrentSubscription } from "@/actions/subscription";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { StudyClient } from "./study-client";

export default async function StudyPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = await params;
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const subscription = await getCurrentSubscription();
    const isFreeUser = !subscription || subscription.isFree || subscription.plan?.tier === PlanTier.FREE;
    if (isFreeUser) {
        const t = await getTranslations("Flashcards");
        return <UpgradePrompt feature={t("title")} description={t("upgrade")} />;
    }

    const [deck, cards] = await Promise.all([getDeckWithCards(deckId), getStudyCards(deckId)]);
    if (!deck) notFound();

    return <StudyClient deckId={deckId} deckName={deck.name} cards={cards.map((c) => ({ id: c.id, front: c.front, back: c.back }))} />;
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { getUserOffers } from "@/actions/job-offers";
import { OffersClient } from "./client";

export default async function OffersPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.OFFER_COMPARATOR);
    if (!isEnabled) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <p className="text-muted-foreground">This feature is coming soon!</p>
            </div>
        );
    }

    // Fetch actual offers from database
    const offers = await getUserOffers(session.user.id);

    return <OffersClient offers={offers} />;
}

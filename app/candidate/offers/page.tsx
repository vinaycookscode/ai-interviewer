import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { checkFeature } from "@/actions/feature-flags";
import { getUserOffers } from "@/actions/job-offers";
import { FEATURES } from "@/lib/features";
import { documentHref } from "@/lib/document-url";
import { OffersClient, type OfferCard } from "./client";

export default async function OffersPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const t = await getTranslations("Offers");
    if (!(await checkFeature(FEATURES.OFFER_COMPARATOR))) {
        return <p className="py-16 text-center text-sg-muted">{t("unavailable")}</p>;
    }

    const offers = await getUserOffers();
    const cards: OfferCard[] = offers.map((o) => ({
        id: o.id,
        company: o.company,
        role: o.role,
        location: o.location,
        status: o.status,
        base: o.baseSalary,
        bonus: o.bonus ?? 0,
        stocks: o.stocks ?? 0,
        deadline: o.deadline ? o.deadline.toISOString() : null,
        letterHref: documentHref(o.offerLetterUrl) ?? null,
    }));

    return <OffersClient offers={cards} />;
}

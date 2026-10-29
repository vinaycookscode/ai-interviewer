import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { checkFeature } from "@/actions/feature-flags";
import { getOfferById } from "@/actions/job-offers";
import { FEATURES } from "@/lib/features";
import { OfferForm } from "../../offer-form";

const ymd = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");
    if (!(await checkFeature(FEATURES.OFFER_COMPARATOR))) redirect("/candidate/offers");

    const { id } = await params;
    // Scoped to the signed-in user
    const offer = await getOfferById(id);
    if (!offer) notFound();

    return (
        <OfferForm
            initial={{
                id: offer.id,
                company: offer.company,
                role: offer.role,
                location: offer.location,
                status: offer.status,
                base: offer.baseSalary,
                bonus: offer.bonus,
                stocks: offer.stocks,
                deadline: ymd(offer.deadline),
                joining: ymd(offer.joiningDate),
                notes: offer.notes ?? "",
                hasLetter: !!offer.offerLetterUrl,
            }}
        />
    );
}

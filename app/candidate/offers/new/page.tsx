import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { OfferForm } from "../offer-form";

export default async function AddOfferPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");
    if (!(await checkFeature(FEATURES.OFFER_COMPARATOR))) redirect("/candidate/offers");

    return (
        <OfferForm
            initial={{ company: "", role: "", location: "", status: "PENDING", base: null, bonus: null, stocks: null, deadline: "", joining: "", notes: "", hasLetter: false }}
        />
    );
}

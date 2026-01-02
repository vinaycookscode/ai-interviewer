import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { checkFeature } from "@/actions/feature-flags";
import { FEATURES } from "@/lib/features";
import { AddOfferForm } from "./form";

export default async function AddOfferPage() {
    const session = await auth();
    if (!session?.user) redirect("/auth/login");

    const isEnabled = await checkFeature(FEATURES.OFFER_COMPARATOR);
    if (!isEnabled) {
        redirect("/candidate/offers");
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Add Job Offer</h1>
            <AddOfferForm />
        </div>
    );
}

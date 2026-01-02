import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getOfferById } from "@/actions/job-offers";
import { EditOfferForm } from "./form";

interface EditOfferPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditOfferPage({ params }: EditOfferPageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/auth/login");

    const { id } = await params;
    const offer = await getOfferById(id);

    if (!offer) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Edit Offer</h1>
            <EditOfferForm offer={offer} />
        </div>
    );
}

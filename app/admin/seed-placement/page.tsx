import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SeedPlacementButton } from "./seed-button";

export default async function AdminSeedPage() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        redirect("/auth/login");
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Seed Placement Data</h1>
            <p className="text-muted-foreground mb-8">
                This will seed the database with sample data for the Campus Placement Success Platform,
                including feature flags, the 90-Day Placement Program, and Company Prep Kits.
            </p>

            <SeedPlacementButton />
        </div>
    );
}

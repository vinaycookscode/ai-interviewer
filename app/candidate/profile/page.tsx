import { auth } from "@/auth";
import { getUserProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/candidate/profile-form";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await auth();

    if (!session || !session.user) {
        redirect("/auth/login");
    }

    const user = await getUserProfile();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <div className="container max-w-2xl py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Manage Profile</h1>
                <p className="text-muted-foreground mt-2">
                    Update your personal details and resume.
                </p>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <ProfileForm user={user} />
            </div>
        </div>
    );
}
